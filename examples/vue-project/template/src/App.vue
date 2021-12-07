<template>
  <h1>{{ projectName }}</h1>
  <p>Created at: {{ projectCreatedAt }}</p>
  <p>Created by: {{ projectAuthor }}</p>
</template>

<script setup lang="ts">
const projectName = "<%= PROJECT_ID %>"
const projectCreatedAt = <%= TIMESTAMP %>
const projectAuthor = "<%= AUTHOR_NAME %>"
</script>
