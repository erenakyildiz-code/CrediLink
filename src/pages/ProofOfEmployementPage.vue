<template>
    <q-page class="flex flex-center">
        <q-card v-if="!proven">
            <q-card-section class="column justify-center align-center items-center">
                <img src="/digiSoft.webp" style="width: 200px; border-radius: 10px;">
                <div class="text-body2 q-ma-sm">Welcome to DigiSoft.</div>
                <q-btn @click="login" label="login" color="primary"></q-btn>
            </q-card-section>
        </q-card>
        <div  v-else class=" full-width ">
            <q-card  class=" q-ma-sm" style="height: 90vh;">
            <q-card-section class="row full-width justify-between">
                <div class="column">
                <div class="text-h5 q-ma-sm">Welcome Bob Bobsson</div>
                <div class="text-body2 q-ma-sm">You are eligible to receive your proof of employement credential.</div>
                </div>
                <img src="/digiSoft.webp" style="max-width: 100px; border-radius: 10px;">
            </q-card-section>
            <q-card-section>
                
                <q-btn v-if="!generatedSchema.schema_ids.length > 0" label="create schema" @click="generateProofOfEmployementSchema" color="primary"> </q-btn>
                <q-btn v-else-if="!selectedCredDef" label="create/Get cred def" @click="generateCredDef" color="primary"> </q-btn>
                <div v-else>
                    <q-list>
                        <q-item v-for="item in items" :key="item.name">
                            <q-item-section>
                                <q-item-label>{{item.name}}</q-item-label>
                                <q-item-label caption>{{item.value}}</q-item-label>
                            </q-item-section>
                        </q-item>
                    </q-list>
                <q-btn @click="giveCredFlow" label="receive credential" color="primary"></q-btn>
                    </div>
            </q-card-section>
        </q-card>
        </div>
        

    </q-page>

</template>


<script setup>

import * as indyBex from "indy-bex-connector"
  import { onMounted, ref,toRaw } from "vue";
  import { useQuasar } from 'quasar';
  const diplomaCredFlow = ref(1);
  const items = [
          {
            "name": "company",
            "value": 'DigiSoft'
          },
          {
            "name": "position",
            "value": 'Software Engineer'
          },
          {
            "name": "salary",
            "value": '5000'
          },
          {
            "name": "startdate",
            "value": '1671956138'
          }
          ,
          {
            "name": "enddate",
            "value": '1703492138'
          }
        ];
  const $q  = useQuasar();
  const connected = ref(false);
  const issued = ref(false);
  const schemas = ref();
  const credDefIds = ref({});
  const proven = ref(false);
  const generatedSchema = ref();
  const selectedSchemaForCredDef = ref();
  const selectedCredDef = ref();
  const credDefCreated = ref(false);
const acapyInstance = ref();
  onMounted(async ()=> {
    acapyInstance.value =  new indyBex.cloudAgentWallet("http://localhost:3000");
    await toRaw(acapyInstance.value).initialiseWalletInstance();
    await getSchemas();
  });
  async function login() {
    await handleConnect();
    //wait for 1 sec
    await new Promise(r => setTimeout(r, 1000));
    
    await startProofFlow();
  }

  async function handleConnect() {
    console.log("listener initialised");
    var x = await toRaw(acapyInstance.value).connect("Proof request for identity credential","proof_req","DigiSoft","DigiSoft",false);
    console.log(x);
    if(x.data){
      $q.notify({
        color: 'green-4',
        textColor: 'white',
        icon: 'cloud_done',
        message: 'Successfully connected to the wallet',
        position: 'top',
        timeout: 2500
      });
      connected.value = true;
    }
    else{
      $q.notify({
        color: 'red-4',
        textColor: 'white',
        icon: 'cloud_off',
        message: 'User denied the request',
        position: 'top',
        timeout: 2500
      });
    }

    //get credential definitions and schemas

    //get all schemas where name is governmentID
    var res = await toRaw(acapyInstance.value).getSchemas();

    //find schema with name DigitalDiploma.
    var filtered = res.schema_ids.filter((schema) => schema.split(':')[2] == "governmentID");
    //map schemas to cred def ids
    schemas.value =  {schema_ids : filtered};
    schemas.value.schema_ids.forEach(async element => {
      credDefIds.value[element] =  await toRaw(acapyInstance.value).getCredentialDefinitions(element);
      console.log(credDefIds.value);

    });
    // Send a message to the content script to request the current time
  }
  async function startProofFlow() {
    

    var proofObject = {
    "attributes": {
                "ssn": {
                    "name": "ssn",
                    "restrictions": [
                        {
                            "cred_def_id": credDefIds.value[schemas.value.schema_ids[0]].credential_definition_ids[0],
                            "attr::ssn::value": "123456-1234"
                        }
                    ]
                },
              },
            "predicates": {}
          }
    var x = await toRaw(acapyInstance.value).proofRequest(proofObject);
    
    if(x.verified == "true"){
      proven.value = true;
      $q.notify({
        color: 'green-4',
        textColor: 'white',
        icon: 'cloud_done',
        message: 'Successfully verified',
        position: 'top',
        timeout: 2500
      });
    }
    else{
      $q.notify({
        color: 'red-4',
        textColor: 'white',
        icon: 'cloud_off',
        message: 'Verification failed',
        position: 'top',
        timeout: 2500
      });
    }

  }

  async function getSchemas() {
    var res = await toRaw(acapyInstance.value).getSchemas();
    console.log(res);
    //find schema with name DigitalDiploma.
    var filtered = res.schema_ids.filter((schema) => schema.split(':')[2] == "ProofOfEmployement");
    console.log(filtered);
    generatedSchema.value = {schema_ids : filtered};
    selectedSchemaForCredDef.value = generatedSchema.value.schema_ids[0];
    if(generatedSchema.value.schema_ids.length > 0){
      diplomaCredFlow.value = 2;
    }
  }
  async function generateProofOfEmployementSchema() {

    
var res = await toRaw(acapyInstance.value).createSchema({
  schema : {
  name: "ProofOfEmployement",
  version: "1.0",
  attrNames: ["company", "position", "startdate","enddate","salary"],
  }
});
var filtered = res.schema_ids.filter((schema) => schema.split(':')[2] == "DigitalDiploma");
    generatedSchema.value = {schema_ids : filtered};
selectedSchemaForCredDef.value = generatedSchema.value.schema_ids[0];
  }
  async function generateCredDef() {
    var hasCredDef = await toRaw(acapyInstance.value).getCredentialDefinitions(selectedSchemaForCredDef.value);
  console.log(hasCredDef);
  if(hasCredDef.credential_definition_ids.length == 0){
    var request = {"credential_definition": {
    "issuerId": null,
    "schemaId": selectedSchemaForCredDef.value,
    "tag": "default"
  },}
  var res = await toRaw(acapyInstance.value).createCredentialDefinition(request);
  selectedCredDef.value = res.credential_definition_state.credential_definition_id;
  }
  else{
    selectedCredDef.value = hasCredDef.credential_definition_ids[0];
  }
  
  diplomaCredFlow.value = 3;
    
  }
  async function giveCredFlow() {
    await handleConnect();
    await new Promise(r => setTimeout(r, 1000));
    await giveEmployementCredential();
  }
  async function giveEmployementCredential() {
        
    var request = {
      "comment": "Get your decentralised verifiable Diploma",
        "attributes": [
          {
            "name": "company",
            "value": 'DigiSoft'
          },
          {
            "name": "position",
            "value": 'Software Engineer'
          },
          {
            "name": "salary",
            "value": '5000'
          },
          {
            "name": "startdate",
            "value": '1671956138'
          }
          ,
          {
            "name": "enddate",
            "value": '1703492138'
          }
        ],
          "credDefId": selectedCredDef.value,
          "schemaId": selectedSchemaForCredDef.value,
    }
    var response = await toRaw(acapyInstance.value).issueCredential(request);
    if(response.data)
    {
      $q.notify({
        color: 'green-4',
        textColor: 'white',
        icon: 'cloud_done',
        message: 'Successfully issued the credential',
        position: 'top',
        timeout: 2500
      });
      diplomaCredFlow.value = 5;
      issued.value = true;
    }
    else{
      $q.notify({
        color: 'red-4',
        textColor: 'white',
        icon: 'cloud_off',
        message: 'User denied the request',
        position: 'top',
        timeout: 2500
      });
    }
  }
</script>