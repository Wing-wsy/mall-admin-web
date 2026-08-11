<template>
  <el-card>
    <template #header>{{ title }}</template>
    <el-empty description="业务页面占位，框架阶段暂不实现" />
  </el-card>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();
const title = computed(() => String(route.meta.title || "占位页"));
</script>
