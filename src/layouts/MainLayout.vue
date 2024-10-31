<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="toggleLeftDrawer"
        />

        <q-toolbar-title>
          CrediLink
        </q-toolbar-title>

        
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      bordered
    >
      <q-list>
        <q-item-label
          header
        >
          Path to bobs future
        </q-item-label>

        <EssentialLink
          v-for="link in linksList"
          :key="link.title"
          v-bind="link"
        />
      </q-list>
      <q-list>
        <q-item-label
          header
        >
          Hiring manager steps
        </q-item-label>

        <EssentialLink
          v-for="link in hiringManagerLinks"
          :key="link.title"
          v-bind="link"
        />
      </q-list>
      
      <q-list>
        <q-item-label
          header
        >
        Project initialiser
        </q-item-label>

        <EssentialLink
          v-for="link in crediLinkLinks"
          :key="link.title"
          v-bind="link"
        />
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref } from 'vue'
import EssentialLink from 'components/EssentialLink.vue'

defineOptions({
  name: 'MainLayout'
})

const linksList = [
  {
    title: 'Government',
    caption: 'Get your first identity document',
    icon: 'badge',
    link: '/Government'
  },
  {
    title: 'University of bob',
    caption: 'Go to your universities page to receive your diploma credential',
    icon: 'school',
    link: '/University'
  },
  {
    title: 'Digisoft',
    caption: 'Get your proof of employement credential from DigiSoft',
    icon: 'apartment',
    link: '/DigiSoft'
  },
  {
    title: 'Login',
    caption: 'Login to system',
    icon: 'login',
    link: '/Login'
  },
  
  
];
const hiringManagerLinks = [
{
    title: 'Government',
    caption: 'Get your first identity document',
    icon: 'badge',
    link: '/GovernmentAlice'
  },
  {
    title: 'CodeNimbus',
    caption: 'Get your hiring manager credential from CodeNimbus',
    icon: 'apartment',
    link: '/HRecive'
  },
  {
    title: 'Login',
    caption: 'Login to system',
    icon: 'login',
    link: '/Login'
  },
]
const crediLinkLinks = [
  {
    title: 'Initialise CrediLink',
    caption: 'Post schemas and credential definitions for crediLink',
    icon: 'settings',
    link: '/initialiseCredilink'
  }
];
const leftDrawerOpen = ref(false)

function toggleLeftDrawer () {
  leftDrawerOpen.value = !leftDrawerOpen.value
}
</script>
