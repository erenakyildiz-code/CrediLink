<template>
    <q-layout>
        <q-page-container>
    <q-page class="flex flex-start">
<q-card class="full-width">
    <q-card-section>
        
        <div class="text-h3">{{ jobItem.companyName }}</div>
            
    </q-card-section>
    <q-separator></q-separator>
    <q-card-section>
        <div class="text-body2">{{ jobItem.jobDescription }}</div>
    </q-card-section>
    <q-card-section>
        <div class="text-h5">You need the following credentials and values:</div>
        <q-list>
            <q-item v-for="(val,key) in jobItem.attribs" :key="key">
                <q-item-section>
                    <q-item-label>{{ val[0].schemaId.split(':')[2] }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                    <q-chip v-for="value in (val).filter(item => item.checked === true)" :key="value"  :color="value.attrib == true ? 'blue' : 'amber-14'"> {{ value.name }} {{ value.attrib ==true ? value.value : value.predicateType + ' ' + value.value  }}</q-chip>
                </q-item-section>
            </q-item>

        </q-list>
        <div class="text-h6">If these values are present on your wallet, apply now ! (note that if you do not have the correct credentials you will fail the proof request part of applience)</div>
        <q-btn color="primary" label="apply" class="full-width q-ma-sm" @click="applyToJob" :disable="userId == null"><q-tooltip v-if="userId == null">Connect to apply</q-tooltip></q-btn>
    </q-card-section>
</q-card>

        </q-page>
    </q-page-container>
    </q-layout>
    </template>


<script setup>
import {ref, toRaw, onMounted} from 'vue';
import apply from 'src/components/Requests/postApply';
import { useQuasar } from 'quasar';
const $q = useQuasar();
const jobItem = ref({});
const userId = ref('');
onMounted(()=> {
    jobItem.value = JSON.parse(localStorage.getItem("selectedJob"));
    userId.value = localStorage.getItem("userId");
    console.log(jobItem.value);
})

const applyToJob = async()=> {
    var res = await apply({id : userId.value, jobId : jobItem.value.jobId});
    if(res.status == '200'){
        $q.notify({
            message: 'Applied successfully',
            color: 'positive',
            position: 'top'
        });
    }
    else{
        $q.notify({
            message: 'Failed to apply',
            color: 'negative',
            position: 'top'
        });
    }
}
</script>