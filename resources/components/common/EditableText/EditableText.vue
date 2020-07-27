<template>
  <v-fade-transition mode="out-in">
    <v-col v-if="editing" key="editing" cols="12" lg="10" xl="8">
      <v-form v-model="validates" @submit.prevent="save">
        <v-text-field
          v-model="localValue"
          dense
          outlined
          :label="label"
          :counter="maxLength"
          :rules="rules"
          :error-messages="errors"
          @keydown.esc="editing = false"
          @input="errors = null"
        >
          <template v-slot:append-outer>
            <save-cancel-icon-buttons
              :save-disabled="!validates"
              @clicked-save="save"
              @clicked-cancel="editing = false"
            />
          </template>
        </v-text-field>
      </v-form>
    </v-col>
    <v-col v-else key="viewing" cols="12">
      <v-hover v-slot:default="{ hover }">
        <div class="d-flex align-center" :class="classes">
          <span class="py-1">
            {{ value }}&nbsp;
          </span>
          <v-fab-transition>
            <v-btn v-show="hover" icon @click="edit">
              <v-icon color="primary">
                mdi-pencil
              </v-icon>
            </v-btn>
          </v-fab-transition>
        </div>
      </v-hover>
    </v-col>
  </v-fade-transition>
</template>

<script>
export default {
  sync: ['errors'],
  components: {
    SaveCancelIconButtons: () => import('@/components/common/SaveCancelIconButtons')
  },
  props: {
    label: {
      type: String,
      default: ''
    },
    value: {
      type: String,
      default: ''
    },
    rules: {
      type: Array,
      default: () => ([])
    },
    classes: {
      type: String,
      default: ''
    },
    maxLength: {
      type: Number,
      default: null
    }
  },
  data () {
    return {
      editing: false,
      validates: true,
      localValue: this.value
    }
  },
  methods: {
    edit () {
      this.localValue = this.value
      this.editing = true
    },
    save () {
      if (this.validates) {
        this.$emit('save', this.localValue)
        this.editing = false
      }
    }
  }
}
</script>