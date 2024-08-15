<template>
  <div class="w-100">
    <div class="row">
      <div class="col-12">
        <div>
          <label for="raw">Raw Input</label><br>
          <small><i>Recommended</i></small>
          <textarea class="form-control" id="raw" v-model="data.raw" rows="4" @change="recomputeOutput"></textarea>
        </div>
        <div class="mt-3">
          <label for="file">Raw File</label><br>
          <small><i>Only accepts CSV</i></small>
          <input type="file" class="form-control" id="file" @change="onFileChange" accept=".csv" :multiple="false" />
        </div>
      </div>
    </div>
    <hr class=" mt-4">
    <div class="row mt-3 w-100">
      <h5>Output</h5>
      <small v-if="(output || []).length > 1000"><i>Note: Only the first {{ displayLimit }} records (out of
          {{
          (output || []).length }})
          have been displayed.</i></small>
      <div class="my-2 px-0 overflow-scroll output border rounded shadow">
        <table class="table table-striped table-sm table-bordered table-hover">
          <thead>
            <tr class="table-primary">
              <th scope="col" v-for="header in headers" :key="header">{{ header }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, rowIndex) in (output || []).slice(0, displayLimit)" :key="`row-${rowIndex}`">
              <td scope="row" v-for="(value, columnIndex) in row" :key="`${columnIndex}-column`">{{ value }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <hr class="mt-4">
    <div class="row mt-3 w-100">
      <h5>Actions</h5>
      <small v-if="(output || []).length > csvLimit"><i>Note: the files downloaded will be split into {{
          csvLimit
          }} records
          chunks.</i></small>
      <div class="row">
        <div class="col-3">
          <p class="py-1"></p>
          <button class="form-control btn btn-primary" @click="download">Download</button>
        </div>
        <div class="col-3">
          <p class="py-1"></p>
          <button class="form-control btn btn-success" @click="copy">{{ copied ? 'Copied!' : 'Copy' }}</button>
        </div>
        <div class="col-3">
          <p class="py-1"></p>
          <button class="form-control btn btn-light" @click="clear">Clear</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  const CACHE_KEY = 'TENDOPAY_LOAN_FORMATTER'
  const FORCE_CACHE = true
  const CSV_LIMIT = 10000
  const DISPLAY_LIMIT = 250
  const HEADERS = [
    'Date Requested',
    'Note',
    'User URL',
    'Reason for Request',
    'Merchant',
    'Cancel Trnx ID',
    'Cancel Trnx Amount'
  ]

  const date = new Date();
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const formattedDate = `${yyyy}_${mm}_${dd}`

  export default {
    data() {
      return {
        data: {
          raw: null
        },
        cacheProcessed: false,
        headers: HEADERS,
        displayLimit: DISPLAY_LIMIT,
        csvLimit: CSV_LIMIT,
        output: null,
        copied: false
      }
    },
    mounted() {
      this.restoreCache()
      this.recomputeOutput()
    },
    computed: {
      inputHeaders () {
        return (this.data.raw || '')
          .split(/\r?\n|\r|\n/g)[0].split(/\t/g)
      },
      userIdIndex() {
        return this.inputHeaders.indexOf('User_ID')
      },
      purchaseDateIndex() {
        return this.inputHeaders.indexOf('Purchased_At')
      },
      typeIndex() {
        return this.inputHeaders.indexOf('Type')
      },
      txnIdIndex() {
        return this.inputHeaders.indexOf('Purchase_TxnId')
      },
      amountIndex() {
        return this.inputHeaders.indexOf('Purchase_Amount')
      }
    },
    methods: {
      onFileChange(e) {
        var file = (e.target.files || e.dataTransfer.files)[0];
        var reader = new FileReader()
        reader.readAsText(file, "UTF-8")
        reader.onload = (evt) => {
          this.data.raw = evt.target.result.replace(/,/g, '\t')
          this.recomputeOutput()
        }
      },
      recomputeOutput() {
        try {
          const formattedSlash = `${mm}/${dd}/${yyyy}`
          const read = (this.data.raw || '')
            .split(/\r?\n|\r|\n/g)
            .map(_ => _.split(/\t/g))
            .slice(1)
          this.output = read.map(_ => [
            formattedSlash,
            '',
            `https://app.tendopay/ph/admin/user/${_[this.userIdIndex]}`,
            `Xendit Status Failed (${_[this.purchaseDateIndex].slice(0, 100)})`,
            _[this.typeIndex],
            _[this.txnIdIndex],
            _[this.amountIndex]
          ])
          if (this.cacheProcessed) {
            this.storeCache()
          }
        } catch (e) {
          //
        }
      },
      storeCache() {
        const obj = {
          data: {
            ...this.data
          }
        }
        localStorage.setItem(CACHE_KEY, JSON.stringify(obj))
      },
      restoreCache() {
        const res = localStorage.getItem(CACHE_KEY)
        if (res) {
          let clear = {}
          try {
            clear = JSON.parse(res)
          } catch (err) {
            clear = {}
          }
          if (!FORCE_CACHE) {
            this.clear()
            console.log(`* LOAN FORMATTER: Invalidated cache`)
          } else {
            const data = clear.data
            Object.keys(data || {}).forEach(_ => {
              if (data[_] != null) {
                this.data[_] = data[_]
              }
            })
            console.log(`* LOAN FORMATTER: Restored cache`)
          }
        }
        this.cacheProcessed = true
      },
      clear() {
        Object.keys(this.data || {}).forEach(_ => {
          if (typeof this.data[_] === 'object' && this.data[_] !== null) {
            this.data[_] = []
          } else {
            this.data[_] = null
          }
        })
        localStorage.removeItem(CACHE_KEY)
        this.recomputeOutput()
      },
      download() {
        let data = []
        let files = []
        for (let i = 0; i < Math.ceil(this.output.length / CSV_LIMIT); i++) {
          data.push(this.output.slice(i * CSV_LIMIT, i * CSV_LIMIT + CSV_LIMIT))
        }
        data.forEach(_ => {
          let csvContent = "data:text/csv;charset=utf-8,"
            + [
              this.headers,
              ..._
            ].map(e => e.join(",")).join("\n");

          files.push(encodeURI(csvContent));
        })

        const link = document.createElement("a")
        document.body.appendChild(link)

        files.forEach((_, index) => {
          link.setAttribute('href', _)
          link.setAttribute('download', `loan_${formattedDate}_${index + 1}.csv`)

          link.click()
        })
      },
      copy() {
        const textarea = document.createElement("textarea");
        textarea.value = [HEADERS, ...this.output].map(_ => _.join('\t')).join('\n');
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);

        this.copied = true
        setTimeout(() => {
          this.copied = false
        }, 2000);
      }
    }
  }
</script>

<style scoped lang="scss">
.output {
  max-height: 50vh;
}

.row {
  margin-right: 0 !important;
  margin-left: 0 !important;
}
</style>