<template>
    <q-card class="q-ma-sm" bordered>
        <q-card-section>
            <div class="text-h5">Hiring</div>
        </q-card-section>
<q-separator></q-separator>
        <q-card-section>
            <q-scroll-area style="height: 75vh;">
            <q-list>

                <q-item v-for="item in items" :key="item" clickable @click="openPopup(item)">
                    <q-item-section>
                        <q-item-label>{{ item.companyName }} is hiring !</q-item-label>
                    </q-item-section>
                    <q-item-section side>
                        Required Credentials
                        <q-chip  v-for="(value,key) in item.attribs" :key="key"> {{ value[0].schemaId.split(':')[2]  }}</q-chip>
                        </q-item-section>
                </q-item>
            </q-list>

            </q-scroll-area>
            <q-btn  label="I am hiring" color="primary" @click="openHiringPopup = true"></q-btn>
        </q-card-section>
    </q-card>
    <q-dialog  v-model="openHiringPopup" maximized>
        <q-card>
            <q-bar> 
          <q-space />

          <q-btn dense flat icon="close" v-close-popup>
            <q-tooltip class="bg-white text-primary">Close</q-tooltip>
          </q-btn>

        </q-bar>
        <q-card-section>
            <div class="text-h5">
                What kind of employee are you looking for ?
            </div>
            <div class="text-body2">
                <q-select v-model="selectedSchemas" multiple :options="possibleCredentials" label="Select schemas" map-options @update:model-value="getSchemaAttrib"/>
            </div>
            <q-card v-for="(val,key) in requestedAtribPredicates" :key="key" class="q-ma-sm">
                <q-card-section>

                    <div class="text-h6">{{ val[0].schemaId.split(':')[2] }}</div>
                </q-card-section>
                <q-card-section class="row full-width " v-for="value in val" :key="value">
                    <q-checkbox class="col-1" :label="'Use ' + value.name" v-model="value.checked"><q-tooltip>Use this field for verification</q-tooltip></q-checkbox>
                    <q-toggle class="col-2" v-model="value.attrib"  :label="value.attrib  ?  'Attribute' : 'Predicate'"></q-toggle>
                    <q-input class="col-8" v-model="value.value" :label=" value.attrib ? 'Required value (EXACT) ' + value.name :'Predicated Value ' + value.name " ></q-input>
                    <q-select class="col-1" v-if="!value.attrib" v-model:model-value="value.predicateType" :options="['>','<','<=','>=']" label="Predicate type"></q-select>
                </q-card-section>
            </q-card>
        </q-card-section>
        <q-card-section>
            <q-input v-model:model-value="companyName" label="Company name (EXACT NAME IN YOUR HRCredential)"></q-input>
            <q-input v-model:model-value="jobDescription" label="Job description" type="textarea"></q-input>
        </q-card-section>
                <q-card-actions>
                    <q-btn label="Create job listing" color="primary" @click="addJobListing"></q-btn>
                </q-card-actions>
    </q-card>
    </q-dialog>
    <q-dialog v-model="openApplyPopup">
        <ApplyPage></ApplyPage>
    </q-dialog>
</template>
<script setup>
import {ref, onMounted,toRaw} from 'vue';
import getHiring from './Requests/getHiring';
import {useQuasar} from 'quasar';
import addHiring from './Requests/sendHiring';
import * as indyBex from "indy-bex-connector";
import {useRouter} from 'vue-router';
import ApplyPage from '../pages/ApplyPage.vue';
const router = useRouter();
//for now some random company names and random positions
const $q = useQuasar();
const openHiringPopup = ref(false);
const items = ref();
const possibleCredentials = ref();
const wallet = ref();
const schemaAttribs = ref({}); //object key = schema_id, value = schema attributes
const selectedSchemas = ref([]);
const requestedAtribPredicates = ref({});
const schemas = ref({});
const openApplyPopup  = ref(false);
const jobDescription = ref('');
const credDefIds = ref({});
const companyName = ref('');
const openPopup = (item)=>{
    
    localStorage.setItem('selectedJob',JSON.stringify(item));
    openApplyPopup.value = true;
}
  async function handleConnect() {
    console.log("listener initialised");
    var x = await toRaw(wallet.value).connect("Proof request for HR credential","proof_req","CrediLink","CrediLink",false);
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
    var res = await toRaw(wallet.value).getSchemas();

    //find schema with name DigitalDiploma.
    var filtered = res.schema_ids.filter((schema) => schema.split(':')[2] == "HRCredential");
    //map schemas to cred def ids
    schemas.value =  {schema_ids : filtered};
    schemas.value.schema_ids.forEach(async element => {
      credDefIds.value[element] =  await toRaw(wallet.value).getCredentialDefinitions(element);
      console.log(credDefIds.value);

    });
    // Send a message to the content script to request the current time
  }
  async function startProofFlow() {
    

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
          }
    var x = await toRaw(wallet.value).proofRequest(proofObject);
    
    if(x.verified == "true"){
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
      throw new Error("Verification failed");
    }

  }
const addJobListing = async () => {

    //first connect wallet.
    await handleConnect();
    
    try {
        //wait 1 sec
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await startProofFlow();
    }
    catch (e) {
        console.log(e);
        return
    }
    var res = await addHiring({'attribs' : requestedAtribPredicates.value, 'companyName': companyName.value, 'jobDescription': jobDescription.value, 'jobId': Math.floor(Math.random() * 1000)});
    if(res.status == 200){
        $q.notify({
            message: 'Job listing created successfully',
            color: 'positive',
            position: 'top'
        });
    }else{
        $q.notify({
            message: 'Job listing creation failed',
            color: 'negative',
            position: 'top'
        });
    }
}

const getSchemaAttrib = async () => {
    requestedAtribPredicates.value = {};
    for(let schema of selectedSchemas.value){
        
        schemaAttribs.value[schema.value] = await wallet.value.getSchemaProperties(schema.value);
        var credDefId = await toRaw(wallet.value).getCredentialDefinitions(schema.value);



        requestedAtribPredicates.value[credDefId.credential_definition_ids[0]] = schemaAttribs.value[schema.value].schema.attrNames.map((attr) => {
            return {
                schemaId: schema.value,
                checked: false,
                attrib: true,
                name: attr,
                value: "",
                predicateType: ""
            }
        });
    }
    console.log(schemaAttribs.value);

}
onMounted(async () => {
    wallet.value = new indyBex.cloudAgentWallet("http://localhost:3000");
    await wallet.value.initialiseWalletInstance();
    possibleCredentials.value = await wallet.value.getSchemas();

    //possible Credentials will be an arra of schema names and IDs object.
    //the incoming value is :{ "schema_ids": [ "3LYuEBsnHMpa9Wk34E2VxP:2:governmentID:1.0", "3LYuEBsnHMpa9Wk34E2VxP:2:ProofOfEmployement:1.0", "3LYuEBsnHMpa9Wk34E2VxP:2:DigitalDiploma:1.0" ] }

    possibleCredentials.value = possibleCredentials.value.schema_ids.map((schema) => {
        return {
            label: schema.split(":")[2],
            value: schema
        }
    });

    items.value = await getHiring();
});

</script>