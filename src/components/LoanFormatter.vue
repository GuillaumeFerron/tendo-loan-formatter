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
      <small v-if="(outputMapped || []).length > 1000"><i>Note: Only the first {{ displayLimit }} records (out of
          {{
          (outputMapped || []).length }})
          have been displayed.</i></small>
      <div class="my-2 px-0 overflow-scroll output border rounded shadow">
        <table class="table table-striped table-sm table-bordered table-hover">
          <thead>
            <tr class="table-primary">
              <th scope="col" v-for="header in headers" :key="header">
                <p class="mb-0">{{ header }}</p>
                <select :id="`${header}-select`" class="form-control p-0" v-model="data.mapping[header]"
                  @change="recomputeOutputMapped">
                  <option value=""></option>
                  <option v-for="inputHeader in inputHeaders" :value="inputHeader" :key="inputHeader">{{
                    inputHeader }}
                  </option>
                </select>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, rowIndex) in (outputMapped || []).slice(0, displayLimit)" :key="`row-${rowIndex}`">
              <td scope="row" v-for="(value, columnIndex) in row" :key="`${columnIndex}-column`">{{ value }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <hr class="mt-4">
    <div class="row mt-3 w-100">
      <h5>Actions</h5>
      <small v-if="(outputMapped || []).length > csvLimit"><i>Note: the files downloaded will be split into {{
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
          <button class="form-control btn btn-light" @click="clear">Clear</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  const CACHE_KEY = 'TENDOPAY_ELS_FORMATTER'
  const FORCE_CACHE = true
  const CSV_LIMIT = 10000
  const DISPLAY_LIMIT = 250
  const HEADERS = [
    'employee_number',
    'firstname',
    'middlename',
    'lastname',
    'email',
    'birthdate',
    'employment_id',
    'gross_income',
    'net_income',
    'department',
    'job_title',
    'hired_date',
    'recommended_interest_rate',
    'recommended_credit_limit',
    'phone_number',
    'special_consideration'
  ]

  export default {
    data() {
      return {
        data: {
          raw: null,
          mapping: {}
        },
        cacheProcessed: false,
        headers: HEADERS,
        displayLimit: DISPLAY_LIMIT,
        csvLimit: CSV_LIMIT,
        output: null,
        outputMapped: null
      }
    },
    mounted() {
      HEADERS.forEach(_ => {
        this.data.mapping[_] = null
      })
      this.restoreCache()
      this.recomputeOutput()
    },
    computed: {
      inputHeaders () {
        return (this.data.raw || '')
          .split(/\r?\n|\r|\n/g)[0].split(/\t/g)
      },
      phoneIndex() {
        return this.inputHeaders.indexOf(this.data.mapping.phone)
      },
      hiredDateIndex() {
        return this.inputHeaders.indexOf(this.data.mapping['hired_date'])
      },
      birthdateIndex() {
        return this.inputHeaders.indexOf(this.data.mapping.birthdate)
      },
      emailIndex() {
        return this.inputHeaders.indexOf(this.data.mapping.email)
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
          this.output = (this.data.raw || '')
            .split(/\r?\n|\r|\n/g)
            .map(_ => _.split(/\t/g))
            .slice(1)
          this.recomputeOutputMapped()
        } catch (e) {
          //
        }
      },
      recomputeOutputMapped() {
        try {
          this.outputMapped = this.output.map(_ => {
            return this.headers.map(__ => {
              let value = this.findValue(__, _)
              if (__ == 'phone_number') {
                value = this.cleanPhone(value)
              }
              if (__ == 'email') {
                value = this.cleanEmail(value)
              }
              if (__ == 'hired_date') {
                value = this.cleanHiredDate(value)
              }
              if (__ == 'birthdate') {
                value = this.cleanBirthdate(value)
              }
              return value
            })
          })
          if (this.cacheProcessed) {
            this.storeCache()
          }
        } catch (e) {
          //
        }
      },
      findValue(header, row) {
        try {
          const inputHeader = this.data.mapping[header]
          if (!inputHeader) {
            return ''
          }
          const inputIndex = this.inputHeaders.indexOf(inputHeader)
          return row[inputIndex]
        } catch (e) {
          return ''
        }
      },
      storeCache() {
        const obj = {
          data: {
            ...this.data,
            mapping: { ...this.data.mapping }
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
            console.log(`* ELS FORMATTER: Invalidated cache`)
          } else {
            const data = clear.data
            Object.keys(data || {}).forEach(_ => {
              if (data[_] != null) {
                this.data[_] = data[_]
              }
            })
            console.log(`* ELS FORMATTER: Restored cache`)
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
        const date = new Date();
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0')
        const dd = String(date.getDate()).padStart(2, '0')
        const formattedDate = `${yyyy}_${mm}_${dd}`

        let data = []
        let files = []
        for (let i = 0; i < Math.ceil(this.outputMapped.length / CSV_LIMIT); i++) {
          data.push(this.outputMapped.slice(i * CSV_LIMIT, i * CSV_LIMIT + CSV_LIMIT))
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
          link.setAttribute('download', `els_${formattedDate}_${index + 1}.csv`)

          link.click()
        })
      },
      cleanPhone(phone) {
        if (this.phoneIndex == -1) {
          return phone
        }

        let value = phone;
        try {
          value = `${value}`.match(/[+0-9]+/g)[0]
        } catch (e) {
          //
        }
        if (value.indexOf("+63") >= 0) {
          value = value.replace("+63", "");
        }
        if (value.indexOf("+") >= 0) {
          value = value.replace("+", "");
        }
        return value
      },
      cleanEmail(email) {
        if (this.emailIndex == -1) {
          return email
        }

        let value = email
        value = value.split('\n')[0]
        value = value.split(';')[0]
        value = value.split(',')[0]
        value = value.split('\t')[0]
        return value
      },
      cleanHiredDate(date) {
        if (this.hiredDateIndex == -1) {
          return date
        }

        return this.convertDate(this.output.slice(0, 100).map(_ => _[this.hiredDateIndex]), date)
      },
      cleanBirthdate(date) {
        if (this.birthdateIndex == -1) {
          return date
        }

        return this.convertDate(this.output.slice(0, 100).map(_ => _[this.birthdateIndex]), date)
      },
      convertDate(values, date) {
        let value = date
        const separator = `${value}`.includes('/') ? '/' : '-'

        const left = values.map(_ => _.split(separator)[0]).filter(_ => !isNaN(_))
        const max = left.reduce((acc, _) => acc > _ ? acc : _, 0)
        var format = max > 31 ? 'YYYY-MM-DD' : max > 12 ? 'DD-MM-YYYY' : 'MM-DD-YYYY'

        const split = value.split(separator)
        try {
          switch (format) {
            case 'DD-MM-YYYY':
              value = `${split[2]}-${`${split[1]}`.length == 1 ? `0${split[1]}` : split[1]}-${`${split[0]}`.length == 1 ? `0${split[0]}` : split[0]}`
              break;
            case 'MM-DD-YYYY':
              value = `${split[2]}-${`${split[0]}`.length == 1 ? `0${split[0]}` : split[0]}-${`${split[1]}`.length == 1 ? `0${split[1]}` : split[1]}`
              break;
            default:
            case 'YYYY-MM-DD':
              value = `${split[0]}-${`${split[1]}`.length == 1 ? `0${split[1]}` : split[1]}-${`${split[2]}`.length == 1 ? `0${split[2]}` : split[2]}`
              break;
          }
        } catch (e) {
          //
        }
        return value
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