<template>
  <v-dialog
    persistent
    :value="value"
    max-width="750px"
    @input="$emit('input', $event)"
  >
    <v-card>
      <v-card-title v-text="$t('users.dialogs.new.title')" />
      <v-card-text class="body-1 font-weight-light" v-text="$t('users.dialogs.new.subtitle')" />
      <v-fade-transition mode="out-in">
        <user-edit-data
          ref="form"
          class="px-2"
          :saving="saving"
          :errors="errors"
          @clicked-cancel="$emit('input', false)"
          @clicked-save="$emit('save-user', $event)"
          @update:errors="$emit('update:errors', $event)"
        />
      </v-fade-transition>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  components: {
    UserEditData: () => import('../UserEditData')
  },
  props: {
    value: {
      type: Boolean,
      required: true
    },
    saving: {
      type: Boolean,
      default: false
    },
    errors: {
      type: Object,
      required: true
    }
  },
  data () {
    return {
      maxNameLength: 50,
      maxDescLength: 100
    }
  },
  watch: {
    value (val) {
      if (!val) {
        this.clear()
      }
    }
  },
  methods: {
    clear () {
      this.$refs.form.clear()
      this.$refs.form.resetValidation()
    },
    removeErrors (field) {
      const errors = {
        ...this.errors,
        [field]: ''
      }
      this.$emit('update:errors', errors)
    }
  }
}
</script>
