<template>
  <el-card>
    <template #header>工作台</template>
    <p>后台前端骨架已就绪。左侧菜单为后续业务占位。</p>
    <el-button type="primary" @click="$router.push('/ping')">去联调 /ping</el-button>
  </el-card>
</template>
