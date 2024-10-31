<template>
    <q-page class="flex flex-center">
        <q-stepper
        v-model="step"
      ref="stepper"
      color="primary"
      style="width: 90%; min-height: 60%;"
      animated>
      <q-step
        :name="1"
        title="Demo information"
        icon="info"
        :done="step > 1"
      >
      <div class="row justify-between">
        <div class="column">

          <div class="text-h5">Welcome to the university of bob</div>
        <div class="text-body2">
            You will be receiving your diploma credential here, first you will connect your wallet to the page, then a proof request will be asked of you so that the university can identify you.

        </div>
        </div>
        <img src="BobUniversity.webp" style="width: 200px; border-radius: 10px;">
      </div>
    </q-step>
      <q-step
        :name="2"
        title="Connect wallet"
        icon="link"
        :done="step > 2"
      >
        <div class="text-h5" >Connect your wallet</div>
        <q-btn v-if="!connected" color="primary" label="Connect wallet" @click="handleConnect"></q-btn><q-chip v-else label="Connected!"></q-chip>
    </q-step>
      <q-step
        :name="3"
        title="Login using credential"
        icon="verified"
        :done="step > 3"
      >
        
      <div class="text-h5" >Prove that you are bob</div>
      <div class="text-body2">The university has bob's social security number in their database, so they will want you to prove that your ID credential has the same SSN. </div>
      <q-select disable v-model:model-value="schemas.schema_ids[0]" label="schema"></q-select>
      <q-select disable v-model:model-value="credDefIds[schemas.schema_ids[0]].credential_definition_ids[0]" label="credential definition"></q-select>
      <q-btn v-if="!proven" label="Proof request" color="primary" @click="startProofFlow" ></q-btn><q-chip v-else label="User proved they have SSN same as bob!"></q-chip>
    </q-step>
      <q-step
        :name="4"
        title="Receive diploma credential"
        icon="download"
        :done="step > 4"
      >
      <div class="text-h5" >Generate and receive your diploma</div>
      <div class="text-body2">The university will now generate your diploma credential and send it to your wallet.</div>
      <div class="text-body2">The schema and the credential definition will also be created here, as before this would have been done by the admins of the university. (or the government would create the schema and university would create the cred_def)</div>
      <br>
      <q-btn-group class="q-mt-lg" v-if="diplomaCredFlow != 5"> 
        <q-btn label="Generate diploma schema" color="primary" :disable="diplomaCredFlow != 1" @click="generateDiplomaSchema"></q-btn>
        <q-btn label="Generate/GET diploma credential definition" color="primary" :disable="diplomaCredFlow != 2" @click="generateCredDef"></q-btn>
        <q-btn label="Connect to wallet" color="primary" :disable="diplomaCredFlow != 3" @click="connect"></q-btn>
        <q-btn label="Receive diploma" color="primary" :disable="diplomaCredFlow != 4" @click="giveDiplomaCredential"></q-btn>
      </q-btn-group>
      <q-chip v-else label="Diploma credential received!"></q-chip>
    </q-step>
      <q-step
        :name="5"
        title="Done"
        icon="done"
        :done="step >5"
      >
      <div class="text-h5" >You have received your diploma credential</div>
      <div class="text-body2">You can now use this credential to prove that you have a degree from the university of bob.</div>
      <div class="text-body2">Now you have to get your proof of employement from codeNimbus.</div>
    </q-step>
      <template v-slot:navigation>

        <q-stepper-navigation>
        <q-btn @click="$refs.stepper.next()" color="primary" v-if="step !== 5" :label=" 'Continue'" :disable="step === 2 && !connected || step === 3 && !proven || step === 4 && !issued" />
          <q-btn v-if="step > 1" flat color="primary" @click="$refs.stepper.previous()" label="Back" class="q-ml-sm" />
      </q-stepper-navigation>
      </template>
        </q-stepper>

    </q-page>

</template>


<script setup>

import * as indyBex from "indy-bex-connector"
  import { onMounted, ref,toRaw } from "vue";
  import { useQuasar } from 'quasar';
  const diplomaCredFlow = ref(1);
  const $q  = useQuasar();
  const step = ref(1);
  const connected = ref(false);
  const issued = ref(false);
  const schemas = ref();
  const credDefIds = ref({});
  const proven = ref(false);
  const generatedSchema = ref();
  const selectedSchemaForCredDef = ref();
  const selectedCredDef = ref();
const acapyInstance = ref();
  onMounted(async ()=> {
    acapyInstance.value =  new indyBex.cloudAgentWallet("http://localhost:3000");
    await toRaw(acapyInstance.value).initialiseWalletInstance();
    await getSchemas();
  });
  async function handleConnect() {
    console.log("listener initialised");
    var x = await toRaw(acapyInstance.value).connect("Proof request for identity credential","proof_req","University person","University person",false);
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
    var filtered = res.schema_ids.filter((schema) => schema.split(':')[2] == "DigitalDiploma");
    
    generatedSchema.value = {schema_ids : filtered};
    selectedSchemaForCredDef.value = generatedSchema.value.schema_ids[0];
    if(generatedSchema.value.schema_ids.length > 0){
      diplomaCredFlow.value = 2;
    }
  }
  async function generateDiplomaSchema() {

    
var res = await toRaw(acapyInstance.value).createSchema({
  schema : {
  name: "DigitalDiploma",
  version: "1.0",
  attrNames: ["university", "gpa", "degree", "startdate","enddate"],
  }
});
var filtered = res.schema_ids.filter((schema) => schema.split(':')[2] == "DigitalDiploma");
    generatedSchema.value = {schema_ids : filtered};
selectedSchemaForCredDef.value = generatedSchema.value.schema_ids[0];
    diplomaCredFlow.value = 2;
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
  async function connect(){
    console.log("listener initialised");
    var x = await toRaw(acapyInstance.value).connect("Issue Digital Diploma","issue_vc","UNIVERSITY OF BOB","UNIVERSITY OF BOB",false);
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
    diplomaCredFlow.value = 4;

  }
  async function giveDiplomaCredential() {
        
    var request = {
      "comment": "Get your decentralised verifiable Diploma",
        "attributes": [
          {
            "name": "university",
            "value": 'UNIVERSITY OF BOB'
          },
          {
            "name": "gpa",
            "value": '305'
          },
          {
            "name": "degree",
            "value": 'Bachelor of Science in Computer Science'
          },
          {
            "name": "startdate",
            "value": '1601021738'
          }
          ,
          {
            "name": "enddate",
            "value": '1695629738'
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