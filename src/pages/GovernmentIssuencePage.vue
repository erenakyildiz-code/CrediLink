<template>
    <q-page class="flex flex-center">
      
      <q-stepper
      v-model="step"
      ref="stepper"
      color="primary"
      style="width: 90%; min-height: 60%;"
      animated
    >
      <q-step
        :name="1"
        title="Demo information"
        icon="info"
        :done="step > 1"
      >
      <div class="row justify-between">
        <div class="column" style="max-width: 80%;">
          <div class="text-h5 q-mb-md">
        Welcome to the government page !
      </div>
      This is where we issue you your government ID.
      And since this is a demo, you will be both the issuer and the receiver of the ID.
      Normally, creating the schema and credential definition would be done by someone at the government office, and you would only be asking for your ID.
      <br>
      <div class="text-bold">The current DID that government uses has role STEWARD, this role was set manually. This is a role that can create schemas and credential definitions.</div>

        </div>
        <img src="/government.webp" style="max-width: 200px; border-radius: 10px;">
      </div>
      

      
      </q-step>

      <q-step
        :name="2"
        title="Create a schema"
        icon="create_new_folder"
        :done="step > 2"
        class="row justify-center align-center"
      >
        
      <q-card style="max-width: 500px;">
        <q-card-section>
          <div class="text-h6">Generate schema</div>
          <div class="text-subtitle">
            With the NPM package, stewards can create any kind of schema they want, but for this demo we will use the schema below.
          </div>
          <div v-if="!generatedSchema || generatedSchema.schema_ids.length == 0">
      <q-input class="q-ma-sm" rounded outlined  label="Name" readonly />
      <q-input class="q-ma-sm" rounded outlined  label="Surname" readonly />
      <q-input class="q-ma-sm" rounded outlined  label="SSN" readonly/>
      <q-input class="q-ma-sm" rounded outlined  label="BirthDate" readonly/>

          </div>
          <div v-else class="text-bold">
            You already completed this step. continue.
          </div>
        </q-card-section>
        <q-card-actions>
          <q-btn v-if="!generatedSchema || generatedSchema.schema_ids.length == 0" color="primary" @click="generateSchema">Generate schema</q-btn>
        </q-card-actions>
      </q-card>
    </q-step>

      <q-step
        :name="3"
        title="Credential definition setup"
        icon="assignment"
        :done="step > 3"
      >
      <div class="text-h5 q-mb-md">
        Credential definition
      </div>
      <div v-if="!selectedCredDef">

        Create a credential definition for the schema/get already generated credential definition for schema:
        <br><br>
        <q-select label="schema ID's" v-model="selectedSchemaForCredDef" :options=" generatedSchema.schema_ids " bordered filled></q-select>
        
        <q-btn color="primary"  @click="createOrGetCredDefFromSchema">Generate/Get</q-btn>
      </div>
      <div v-else class="text-bold">
        Successfully generated/selected credential definition. continue.
      </div>
        
      </q-step>

      <q-step
        :name="4"
        title="Get your credential"
        icon="fingerprint"
        
        :done="step > 4"
        class="row items-center justify-center"
      >
      <q-card style="max-width: 500px;">
        <q-card-section>
          <div class="text-h6">Get government ID</div>
          <div class="text-subtitle">Get your Identification credential! Normally this would be a government's page, with a login using the user's
             social security number and password. But this is not an official government backed project, so bob will get their credential purely by entering this page.
          </div>
          
      <q-input class="q-ma-sm" rounded outlined  label="Name" readonly v-model="bob.name"/>
      <q-input class="q-ma-sm" rounded outlined  label="Surname" readonly v-model="bob.surname"/>
      <q-input class="q-ma-sm" rounded outlined  label="Social security number" readonly v-model="bob.ssn"/>
      <q-input class="q-ma-sm" rounded outlined  label="Date of birth" readonly v-model="bob.birthday"/>
        </q-card-section>
        <q-card-actions>
          <q-btn v-if="!connected" label="Connect wallet" color="primary" icon="wallet" @click="handleConnect"></q-btn><q-chip v-else>Connected!</q-chip>
          <q-space></q-space>
          <q-btn color="primary" @click="handleCredentialIssuence" :disable="!connected" v-if="!issued">Get bob's ID<q-tooltip v-if="!connected">You need to connect your wallet first.</q-tooltip></q-btn>
          <q-chip v-else>Issued, check your wallet!</q-chip>
        </q-card-actions>
      </q-card>
      </q-step>
      <q-step
        :name="5"
        title="Done"
        icon="done"
        
        :done="step > 5"
        class="row full-width items-center justify-center align-center"
      >
      <div class="text-h5">
        Success
      </div>
      <div class="text-body2">
        You have successfully received the credential as bob. You can check your wallet to see the issued credential, then go to university of bob page to get your diploma credential.
      </div>

      </q-step>
      <template v-slot:navigation>
        <q-stepper-navigation>
          <q-btn @click="$refs.stepper.next()" color="primary" v-if="step !== 5" :label=" 'Continue'" :disable="step === 2 && !generatedSchema || step=== 3 && !selectedCredDef || step=== 4 && !issued "/>
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
  const $q  = useQuasar();
  const step = ref(1);
  const selectedSchemaForCredDef = ref();
  const selectedCredDef = ref();
  const acapyInstance = ref();
  const connected = ref(false);
  const issued = ref(false);
  const bob = ref({name: "bob", surname: 'bobsson', ssn: '123456-1234', birthday: '01.01.2000'});
  const generatedSchema = ref();
  defineOptions({
    name: 'LoginPage'
  });
  
  onMounted(async ()=> {
    acapyInstance.value =  new indyBex.cloudAgentWallet("http://localhost:3000");
    //if there is no mnemonic on local storage, run initialiseWalletInstance without any params,
    //otherwise run it with the mnemonic as a parameter
    //mnemonic will always be the same for the demo. So i will set it here:
    localStorage.setItem("mnemonic", "crime sure about liquid pelican goat cancel balance axis lock sting toilet");
    if(localStorage.getItem("mnemonic") != null){
      var res = await toRaw(acapyInstance.value).initialiseWalletInstance(localStorage.getItem("mnemonic"));
    }
    else
    {
      var res = await toRaw(acapyInstance.value).initialiseWalletInstance();
      //set mnemonic to local storage
      localStorage.setItem("mnemonic", res.mnemonic);
    }
    //lets list the dids and if there are none, create one.
    var dids = await toRaw(acapyInstance.value).listDIDs();
    //the dids are in an array.
    if(dids.length == 0){
      var did = await toRaw(acapyInstance.value).generateNewDID();
    }
    else{
    }
    getSchemas();
  });
  async function getSchemas() {
    var res = await toRaw(acapyInstance.value).getSchemas();
    console.log(res);
    //only get schemas with name governmentID
    var filtered = res.schema_ids.filter((schema) => schema.split(':')[2] == "governmentID");
    generatedSchema.value = {schema_ids : filtered};
  }
  async function generateSchema(){

    var res = await toRaw(acapyInstance.value).createSchema({
      schema : {
      name: "governmentID",
      version: "1.0",
      attrNames: ["name", "surname", "ssn", "birthdate"],
      }
    });
    console.log(res);
    generatedSchema.value = res;
  }
async function createOrGetCredDefFromSchema(){
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
  
}

  // Method to handle the Login button click event
  async function handleConnect() {
    console.log("listener initialised");
    var x = await toRaw(acapyInstance.value).connect("Issue Idenitfication Credential","issue_vc","Government person","Government person",false);
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


    // Send a message to the content script to request the current time
  }
  async function handleCredentialIssuence() {
    
    var request = {
      "comment": "Get your decentralised verifiable government ID",
        "attributes": [
          {
            "name": "name",
            "value": bob.value.name
          },
          {
            "name": "surname",
            "value": bob.value.surname
          },
          {
            "name": "ssn",
            "value": bob.value.ssn
          },
          {
            "name": "birthdate",
            "value": bob.value.birthday
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
  
  