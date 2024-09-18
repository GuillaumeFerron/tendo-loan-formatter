<template>
  <div class="card mb-0 w-75">
    <div class="card-body px-5">
      <div class="d-flex justify-content-between align-items-center">
        <div>
          <h3>Loan Formatter</h3>
        </div>
        <div v-if="tooltipContent.length > 0" v-tooltip="{
          content: tooltipContent,
          html: true,
          hideTriggers: ['click'],
          autoHide: true
        }" class="clickable">
          <h3>ⓘ</h3>
        </div>
      </div>
      <LoanFormatter />
    </div>
  </div>
</template>

<script>
import LoanFormatter from '../LoanFormatter.vue'

export default {
  components: {
    LoanFormatter
  },
  data() {
    return {
      tooltip: {
        old: 'https://docs.google.com/spreadsheets/d/1dxWVEJdvlRuuE0DJX7AAsFAw0f7CrO5X41PwdzLaHZA/edit#gid=30807767',
        guide: 'https://scribehow.com/shared/Using_the_Loan_Formatter__-1DZElN5Q5m1nW96ZFmWoQ'
      }
    }
  },
  computed: {
    tooltipContent() {
      return (this.tooltip.guide ? `Guide: <a href="${this.tooltip.guide}" target="_blank">Here</a><br>` : '') + (this.tooltip.old ? `Legacy: <a href="${this.tooltip.old}" target="_blank">Here</a>` : '')
    }
  }
}
</script>

<style lang="scss" scoped>
.card {
  -webkit-box-shadow: 5px 5px 15px 5px rgba(0, 0, 0, 0.3);
  box-shadow: 5px 5px 15px 5px rgba(0, 0, 0, 0.3);
}
</style>
