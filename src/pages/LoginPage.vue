<template>
  <q-layout>
    <q-header elevated>
      <q-toolbar>
        <q-toolbar-title>
          CrediLink
        </q-toolbar-title>
        <q-btn
          flat
          icon="login"
          label="Connect"
          v-if="!connected"
          @click="connectWallet"
          ></q-btn>
        
      </q-toolbar>
    </q-header>
    <q-page-container class="row"  >
      <div class="col-lg-10 col-12" >
<HiringPage ></HiringPage>
      </div>
      <div class="col-lg-2 col-12" >
          <div class="col-12 full-width" >
            <div class="q-ma-sm column justify-center items-center" >
              <q-card class="full-width"> 
                <q-card-section>
                  <div class="text-h5">Job Notifications</div>
                </q-card-section>
                <q-card-section v-if="userType == 'HR'">
                  <q-list v-for="item in companyNotifications" :key="item">
                    <q-item v-for="(val,key) in item.nominees" :key="key" clickable 
                    @click="val.status == 'pending' ? 
                    startProofFlowFullyOutOfBand(key,item.jobId) : 
                    val.status == 'done' ? 
                    proofFlowSecondPart(item,key) : 
                    val.status == 'presentation-sent' ?
                    verifyProof(item,key) :
                    ()=>{} ">
                      <q-item-label v-if="val.status == 'pending'">User {{ key }} Wants the job, Start credential flow ?</q-item-label>
                      <q-item-label v-else-if="val.status == 'request-sent'">Request to start flow has been sent. Waiting for response from user {{ key }}</q-item-label>
                      <q-item-label v-else-if="val.status == 'done'">Connection success, Create proof request for {{ key }}</q-item-label>
                      <q-item-label v-else-if="val.status == 'proof-request-sent'">Proof request sent, waiting for response from user {{ key }}</q-item-label>
                      <q-item-label v-else-if="val.status == 'presentation-sent'">Proof presentation received from {{ key }}, verify now ?</q-item-label>
                    </q-item>
                  </q-list>

                </q-card-section>
                <q-card-section v-else-if="userType == 'User'">
                  <q-list v-for="item in companyNotifications" :key="item">
                    <q-item v-for="(val,key) in item.nominees" :key="key" clickable 
                    @click="val.status == 'request-sent' ?
                     receiveInvitation(val,item.companyName,key,item.jobId) :
                     val.status == 'proof-request-sent' ?
                     generateProofResponse(item,key) : ()=> {} ">
                      <q-item-label v-if="val.status == 'pending'">You have applied to {{ item.companyName }}</q-item-label>
                      <q-item-label v-else-if="val.status == 'request-sent'">{{ item.companyName }} has requested to connect to start the credential flow, please accept.</q-item-label>
                      <q-item-label v-else-if="val.status == 'done'">Connection success, Wait for proof request from {{item.companyName}}.</q-item-label>
                      <q-item-label v-else-if="val.status == 'proof-request-sent'">{{ item.companyName }} Requests proof of your credentials</q-item-label>
                      <q-item-label v-else-if="val.status == 'presentation-sent'">Proof presentation sent to {{item.companyName}}, wait for verification</q-item-label>
                      <q-item-label v-else-if="val.status == 'finished-proof'">Your proof presentation has been received by {{item.companyName}}. You might hear from them soon..</q-item-label>
                    </q-item>
                  </q-list>

                </q-card-section>
              </q-card>
            </div>
          </div>

</div>
    </q-page-container>
  </q-layout>
    <q-dialog v-model="openLoginDialog" persistent>
      <q-card>

      <div class="q-pa-md">
    <div class="q-gutter-y-md" style="max-width: 350px">
      <q-option-group
        v-model="panel"
        inline
        :options="[
          { label: 'Company', value: 'mails' },
          { label: 'User', value: 'alarms' },
          { label: 'Register User', value: 'movies' }
        ]"
      />

      <q-tab-panels v-model="panel" animated class="shadow-2 rounded-borders">
        <q-tab-panel name="mails">
          <div class="text-h6">Company</div>
          Login with your HR credential
          <q-input v-model="companyName" label="Company name" />
          <q-btn label="Login" color="primary" class="full-width" @click="startProofFlowForHR"/>
          
        </q-tab-panel>

        <q-tab-panel name="alarms">
          <div class="text-h6">User</div>
          Login using your CrediLink ID credential
          <q-input v-model="id" label="ID in credential"></q-input>
          <q-btn label="Login" color="primary" class="full-width" @click="startProofFlow"/>
        </q-tab-panel>

        <q-tab-panel name="movies">
          <div class="text-h6">Register</div>
          Get your CrediLink ID credential
          <q-input v-model="user.name" label="username"></q-input>
          <q-input v-model="user.email" label="email"></q-input>
          <q-btn label="Register" color="primary" @click="giveUserCredilinkCredential" class="full-width" />
        </q-tab-panel>
      </q-tab-panels>
    </div>
  </div></q-card>
    </q-dialog>
  </template>
  
  <script setup>
  //if you are reading this code and think it is too complex, you are correct, this is very complicated.
  //this is because i have only one month to finish this project demo.

  import * as indyBex from "indy-bex-connector"
  import { onMounted, ref,toRaw } from "vue";
  import HiringPage from "src/components/HiringPage.vue";
  import { useQuasar } from "quasar";
  import getHiring from "src/components/Requests/getHiring";
  const companyName = ref('');
  const $q = useQuasar();
  const openLoginDialog = ref(false);
  const connected = ref(false);
  const user = ref({name: '', email: ''});
  const id = ref();
  const acapyInstance = ref();
  const panel = ref('alarms');
  const selectedCredDef = ref();
  const selectedSchemaForCredDef = ref();
  const generatedSchema = ref();
  const schemas = ref();
  const credDefIds = ref({});
  const notifs = ref([]);
  const companyNotifications = ref();
  const userType = ref('');

  const connectWallet = async () => {
    await handleConnect();
  }

  const receiveInvitation = async(i,companyName,userId,jobId)=> {
    var res = await toRaw(acapyInstance.value).fullyOutOfBandReceiveConnect({invitation: i.invitation, companyName: companyName,jobId: jobId,userId: userId});

    if(res.data){
      $q.notify({
        color: 'green-4',
        textColor: 'white',
        icon: 'cloud_done',
        message: 'Successfully sent request',
        position: 'top',
        timeout: 2500
      });
    }
    else{
      $q.notify({
        color: 'red-4',
        textColor: 'white',
        icon: 'cloud_off',
        message: 'Request could not be sent',
        position: 'top',
        timeout: 2500
      });
    }
    refreshPage();
  }
  async function startProofFlowFullyOutOfBand(userId,jobId) {
    var x = await toRaw(acapyInstance.value).fullyOutOfBandConnect({user : userId , job:  jobId});
    if(x.data){
      $q.notify({
        color: 'green-4',
        textColor: 'white',
        icon: 'cloud_done',
        message: 'Successfully created connection request for '+ userId,
        position: 'top',
        timeout: 2500
      });
    }
    else{
      $q.notify({
        color: 'red-4',
        textColor: 'white',
        icon: 'cloud_off',
        message: 'Request could not be created',
        position: 'top',
        timeout: 2500
      });
    }
    refreshPage();
  }
  
  async function proofFlowSecondPart(job,userId){


    //result of console.log(job)

    /*
    attribs
: 
3LYuEBsnHMpa9Wk34E2VxP:2:ProofOfEmployement:1.0
: 
Array(5)
0
: 
{checked: true, attrib: true, name: 'position', value: 'Software Engineer', predicateType: ''}
1
: 
{checked: false, attrib: true, name: 'startdate', value: '', predicateType: ''}
2
: 
{checked: false, attrib: true, name: 'salary', value: '', predicateType: ''}
3
: 
{checked: false, attrib: true, name: 'enddate', value: '', predicateType: ''}
4
: 
{checked: false, attrib: true, name: 'company', value: '', predicateType: ''}

    */

    /*
    Object to create :
    {
    "requested_attributes": {
                "ssn": {
                    "name": "ssn",
                    "restrictions": [
                        {
                            "cred_def_id": "WcwnxihsS8s1RqcNkVnfBr:3:CL:46:default",
                            "attr::ssn::value": "123456-1234"
                        }
                    ]
                  },
            "requested_predicates": 
            { "someItem": 
             {
          "name": "someItem",
          "p_type": ">=", //this is the predicate type. Can be >=, <=, >, <
          "p_value": 0, //this is the value that the predicate is compared to.
          "restrictions": [
            {
              "someItem": "credDefIdOfSomeItem",
            }
          ]
        }
      }
    }
    */
   var proofRequest = {
    "requested_attributes": {},
    "requested_predicates": {},
   }

   //dynamic keys of json must be in square brackets. ["attr::" + item.name + "::value"]
   //attribs is an object with keys as credDefIds and values as an array of objects containing name, attrib, value, predicateType and checked

   // Iterate over the credDefIds in job.attribs GPTo1 wrote this, shame on you copilot
  for (var credDefId in job.attribs) {
    var attributesArray = job.attribs[credDefId];
    // Iterate over the attributes in each array
    for (var i = 0; i < attributesArray.length; i++) {
      var attribute = attributesArray[i];
      // Include only if 'checked' is true
      if (attribute.checked) {
        if (attribute.attrib) {
          // It's an attribute
          let restriction = {
            "cred_def_id": credDefId
          };
          restriction["attr::" + attribute.name + "::value"] = attribute.value;

          proofRequest.requested_attributes[attribute.name] = {
            "name": attribute.name,
            "restrictions": [restriction]
          };
        } else {
          // It's a predicate
          let restriction = {
            "cred_def_id": credDefId
          };

          proofRequest.requested_predicates[attribute.name] = {
            "name": attribute.name,
            "p_type": attribute.predicateType,
            "p_value": parseInt(attribute.value),
            "restrictions": [restriction]
          };
        }
      }
    }
  }
  var res = await toRaw(acapyInstance.value).fullyOutOfBandCreateProofRequest(
    {
      "proofRequest" : proofRequest, 
      "jobId": job.jobId,
      "userId": userId,
      "inviMsgIdRequester" : job.nominees[userId].inviMsgIdRequester
    });
  if(res.data){
    $q.notify({
      color: 'green-4',
      textColor: 'white',
      icon: 'cloud_done',
      message: 'Successfully created proof request',
      position: 'top',
      timeout: 2500
    });
  }
  else{
    $q.notify({
      color: 'red-4',
      textColor: 'white',
      icon: 'cloud_off',
      message: 'Proof request could not be created',
      position: 'top',
      timeout: 2500
    });
  }

    //attrib is an object with keys as credDefIds and values as an array of objects containing name, attrib, value, predicateType and checked
    //if the checked value is true this means that the value is required for the proof request.
    //if the attrib field is true this means it is an attribute and not a predicate.
    //else the predicateType is the type of predicate and value is the value to be compared to.

  }
  async function generateProofResponse(job,userId){
    var res = await toRaw(acapyInstance.value).fullyOutOfBandCreateProofRepresentation(
    {
      "jobId": job.jobId,
      "userId": userId,
      "inviMsgIdRequestee" : job.nominees[userId].inviMsgIdRequestee
    });
    if(res.data){
      $q.notify({
        color: 'green-4',
        textColor: 'white',
        icon: 'cloud_done',
        message: 'Successfully created proof representation',
        position: 'top',
        timeout: 2500
      });
    }
    else{
      $q.notify({
        color: 'red-4',
        textColor: 'white',
        icon: 'cloud_off',
        message: 'Proof representation could not be created',
        position: 'top',
        timeout: 2500
      });
    }
  }
  async function verifyProof(job,userId){
    var res = await toRaw(acapyInstance.value).fullyOutOfBandVerifyProof(
    {
      "jobId": job.jobId,
      "userId": userId,
      "inviMsgIdRequester" : job.nominees[userId].inviMsgIdRequester
    });
    if(res.data){
      $q.notify({
        color: 'green-4',
        textColor: 'white',
        icon: 'cloud_done',
        message: 'Successfully verified proof',
        position: 'top',
        timeout: 2500
      });
    }
    else{
      $q.notify({
        color: 'red-4',
        textColor: 'white',
        icon: 'cloud_off',
        message: 'Proof could not be verified',
        position: 'top',
        timeout: 2500
      });
    }
  }
  async function getSchemas() {
    var res = await toRaw(acapyInstance.value).getSchemas();
    console.log(res);
    //find schema with name DigitalDiploma.
    var filtered = res.schema_ids.filter((schema) => schema.split(':')[2] == "CrediLinkID");
    
    generatedSchema.value = {schema_ids : filtered};
    selectedSchemaForCredDef.value = generatedSchema.value.schema_ids[0];
    if(generatedSchema.value.schema_ids.length > 0){
    }
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
  
    
  }
  const giveUserCredilinkCredential = async() => {
    
    var request = {
      "comment": "Get your credilink credential",
        "attributes": [
        {
          "name": "ID",
          "value": Math.random().toString(36).substring(7)
        },
        {
          "name": "name",
          "value": user.value.name
        },
        {
          "name": "email",
          "value": user.value.email
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
  async function handleConnect() {
    console.log("listener initialised");
    var x = await toRaw(acapyInstance.value).connect("Login","issue_vc","CrediLink","CrediLink",false);
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
      openLoginDialog.value = true;
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
  
  async function startProofFlow() {
    

    var proofObject = {
    "attributes": {
                "ID": {
                    "name": "ID",
                    "restrictions": [
                        {
                            "cred_def_id": selectedCredDef.value,
                            "attr::ID::value": id.value
                        }
                    ]
                },
              },
            "predicates": {}
          }
    var x = await toRaw(acapyInstance.value).proofRequest(proofObject);
    
    if(x.verified == "true"){
      $q.notify({
        color: 'green-4',
        textColor: 'white',
        icon: 'cloud_done',
        message: 'Successfully verified',
        position: 'top',
        timeout: 2500
      });
      localStorage.setItem("userId",id.value);
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
    openLoginDialog.value = false;
    //notifs is an array of objects with a field called nominees which is an object with keys as userIds and values as objects containing invitation and connection data
    companyNotifications.value = notifs.value.filter((item) => id.value in item.nominees);
    userType.value = 'User';
  }
  async function startProofFlowForHR() {
    // Get the raw instance once, but don't use it directly for async calls.
    const rawInstance = toRaw(acapyInstance.value);

    // Await the call to getSchemas directly on the raw instance.
    var res = await rawInstance.getSchemas();

    // Find schema with name DigitalDiploma.
    var filtered = res.schema_ids.filter((schema) => schema.split(':')[2] == "HRCredential");

    // Map schemas to cred def ids
    schemas.value = { schema_ids: filtered };
    console.log(schemas.value);

    for (var i = 0; i < schemas.value.schema_ids.length; i++) {
        const schemaId = schemas.value.schema_ids[i];
        console.log(schemaId);
        credDefIds.value[schemaId] = await rawInstance.getCredentialDefinitions(schemaId);
    }

    var proofObject = {
        "attributes": {
            "companyName": {
                "name": "companyName",
                "restrictions": [
                    {
                        "cred_def_id": credDefIds.value[schemas.value.schema_ids[0]].credential_definition_ids[0],
                        "attr::companyName::value": companyName.value
                    }
                ]
            },
        },
        "predicates": {}
    };

    var x = await rawInstance.proofRequest(proofObject);

    if (x.verified == "true") {
        $q.notify({
            color: 'green-4',
            textColor: 'white',
            icon: 'cloud_done',
            message: 'Successfully verified',
            position: 'top',
            timeout: 2500
        });
    } else {
        $q.notify({
            color: 'red-4',
            textColor: 'white',
            icon: 'cloud_off',
            message: 'Verification failed',
            position: 'top',
            timeout: 2500
        });
    }
    openLoginDialog.value = false;
    companyNotifications.value = notifs.value.filter((item) => item.companyName == companyName.value);
    userType.value = 'HR';
}

  onMounted(async () => {
    
    acapyInstance.value =  new indyBex.cloudAgentWallet("http://localhost:3000");
    await toRaw(acapyInstance.value).initialiseWalletInstance();

    notifs.value = await getHiring();
    await getSchemas();
    await generateCredDef();
  });
  defineOptions({
    name: 'LoginPage'
  });
  
  async function refreshPage(){
    

    notifs.value = await getHiring();
    if(userType.value == 'User'){
      companyNotifications.value = notifs.value.filter((item) => id.value in item.nominees);
    }
    else if(userType.value == 'HR'){
      companyNotifications.value = notifs.value.filter((item) => item.companyName == companyName.value);
    }
  }
  </script>
  
  