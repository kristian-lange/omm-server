<template>
  <fragment>
    <v-tooltip
      bottom
      color="success"
    >
      <template #activator="{ on }">
        <v-icon
          :disabled="saveDisabled"
          color="success"
          v-on="on"
          @click="$emit('clicked-save')"
        >
          mdi-check
        </v-icon>
      </template>
      {{ $t('buttons.save') }}
    </v-tooltip>
                  &nbsp;
    <v-tooltip bottom>
      <template #activator="{ on }">
        <v-icon
          v-on="on"
          @click="$emit('clicked-cancel')"
        >
          mdi-cancel
        </v-icon>
      </template>
      {{ $t('buttons.discard') }}
    </v-tooltip>
  </fragment>
</template>

<script>
export default {
  props: {
    saveDisabled: { type: Boolean, default: false }
  }
}
</script>
