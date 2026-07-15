<template>
  <div class="cert-table-wrap">
    <div class="cert-sheet">
      <table
        border="0"
        cellspacing="0"
        cellpadding="0"
        width="100%"
        class="table-no-border cert-title-table"
      >
        <tbody>
          <tr>
            <td colspan="4" class="cert-main-title">报废机动车回收证明</td>
          </tr>
          <tr>
            <td class="f-row1" style="width: 11%">回收企业名称：</td>
            <td class="f-row1 scdw" style="width: 52%">{{
              certData.hsqymc || '鑫广再生资源（上海）有限公司'
            }}</td>
            <td class="f-row1" style="width: 11%">回收证明编号：</td>
            <td class="f-row1 hszmbh" style="width: 28%">{{ certData.hszmbh || '—' }}</td>
          </tr>
        </tbody>
      </table>

      <table
        border="0"
        cellspacing="0"
        cellpadding="0"
        width="100%"
        class="table-border cert-main-table"
      >
        <tbody>
          <tr>
            <td style="width: 9%">车主名称</td>
            <td style="width: 29%">{{ certData.syr || '—' }}</td>
            <td style="width: 9%">车主身份证号<br />/代码证号</td>
            <td style="width: 21%">{{ certData.sfzmhm || '—' }}</td>
            <td style="width: 9%">车主联系电话</td>
            <td style="width: 21%">{{ certData.dh || '—' }}</td>
            <!-- <td rowspan="7" class="side-column">
              <table border="0" cellspacing="0" cellpadding="0" class="side-inner-table">
                <tbody>
                  <tr>
                    <td class="side-cell-top"><p>第</p></td>
                  </tr>
                  <tr>
                    <td class="side-cell-mid">
                      <p>{{ copies[0].lianName }}</p>
                      <p>联</p>
                    </td>
                  </tr>
                  <tr>
                    <td class="side-cell-desc"><p>{{ copies[0].lianDesc }}</p></td>
                  </tr>
                  <tr>
                    <td class="side-cell-bottom">
                      <p>联</p>
                      <p>共</p>
                    </td>
                  </tr>
                  <tr>
                    <td class="side-cell-six"><p>六</p></td>
                  </tr>
                  <tr>
                    <td><p>联</p></td>
                  </tr>
                </tbody>
              </table>
            </td> -->
          </tr>
          <tr>
            <td>车主地址</td>
            <td>{{ certData.dz || '—' }}</td>
            <td>交车日期</td>
            <td>{{ formatDate(certData.jcsj) }}</td>
            <td>注册登记日期</td>
            <td>{{ certData.ccdjrq || '—' }}</td>
          </tr>
          <tr>
            <td>车辆牌照号码</td>
            <td>{{ certData.hphm || '—' }}</td>
            <td>车辆类型</td>
            <td>{{ getCllxLabel(certData.cllx) }}</td>
            <td>车辆使用性质</td>
            <td>{{ getSyxzLabel(certData.syxz) }}</td>
          </tr>
          <tr>
            <td>车辆品牌型号</td>
            <td>{{ certData.ppxh || '—' }}</td>
            <td>车辆识别代号</td>
            <td>{{ certData.clsbdh || '—' }}</td>
            <td>整备质量(kg)</td>
            <td>{{ certData.zbzl || '—' }}</td>
          </tr>
          <tr>
            <td>动力类别</td>
            <td>{{ getRyzlLabel(certData.ryzl) }}</td>
            <td>发动机号码</td>
            <td>{{ certData.fdjh || '—' }}</td>
            <td>动力电池编码</td>
            <td>{{ certData.dcbmc || '' }}</td>
          </tr>
          <tr>
            <td colspan="6">
              <table
                border="0"
                cellspacing="0"
                cellpadding="0"
                class="table-no-border1 cert-footer-table"
              >
                <tbody>
                  <tr>
                    <td class="ewm">
                      <QrcodeVue
                        v-if="qrLink"
                        :value="qrLink"
                        :size="130"
                        level="H"
                        render-as="svg"
                      />
                    </td>
                    <td class="cert-stamp-col">
                      <p>商务主管部门（章/监印）</p>
                      <p class="cert-stamp-title">上海市商务委员会</p>
                      <p class="cert-stamp-title">监印</p>
                      <p>（扫描左侧二维码验真）</p>
                    </td>
                    <td class="cert-company-col">
                      <p>回收企业（章）</p>
                      <p class="cert-handler">经办人：</p>
                      <p>{{ certData.jcrq || certData.cjsj || '' }}</p>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
          <tr>
            <td colspan="6" class="cert-note">
              <span class="cert-note-label">说明：</span>
              本表一式六联：一联车主留存；二联交当地公安交通管理部门备查；三联回收企业留存；四联交当地商务主管部门备查；五联用于申领补贴资金；六联交当地交通运输管理部门备查。
            </td>
          </tr>
        </tbody>
      </table>

      <div class="footer-company">{{ certData.hsqymc || '上海市商务委员会监制' }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import type { BfdjHszmData } from '@/types/recycle/bfdj'
  import QrcodeVue from 'qrcode.vue'

  defineOptions({ name: 'VehicleArchiveCertificateTable' })

  interface DictOption {
    label: string
    value: string
  }

  interface Props {
    certData: BfdjHszmData
    qrLink?: string
    cllxOptions?: DictOption[]
  }

  const props = withDefaults(defineProps<Props>(), {
    qrLink: '',
    cllxOptions: () => []
  })

  // const copies = [
  //   { lianName: '一', lianDesc: '车主留存' },
  //   { lianName: '二', lianDesc: '交当地公安交通管理部门备查' },
  //   { lianName: '三', lianDesc: '回收企业留存' },
  //   { lianName: '四', lianDesc: '交当地商务主管部门备查' },
  //   { lianName: '五', lianDesc: '用于申领补贴资金' },
  //   { lianName: '六', lianDesc: '交当地交通运输管理部门备查' }
  // ]

  function formatDate(value?: string) {
    if (!value) return '—'
    return String(value).substring(0, 10)
  }

  function getSyxzLabel(value?: string) {
    const map: Record<string, string> = {
      A: '非营运',
      B: '公路客运',
      C: '公交客运',
      D: '出租客运',
      E: '租赁',
      F: '旅游客运',
      G: '货运',
      H: '危化品运输',
      I: '教练',
      T: '营转非',
      U: '出租营转非',
      V: '预约出租客运',
      W: '预约出租营转非'
    }
    return (value && map[value]) || value || '—'
  }

  function getRyzlLabel(value?: string) {
    const map: Record<string, string> = {
      '1': '汽油',
      '2': '柴油',
      '3': '液化石油气',
      '4': '天然气',
      '5': '甲醇',
      '6': '乙醇',
      '7': '太阳能',
      '8': '混合动力',
      '9': '电',
      A: '氢',
      B: '生物燃料',
      C: '二甲醚',
      D: '其他'
    }
    return (value && map[value]) || value || '—'
  }

  function getCllxLabel(value?: string) {
    if (!value) return '—'
    const item = props.cllxOptions.find((o) => o.value === String(value))
    return item ? item.label : value
  }
</script>

<style scoped lang="scss">
  .cert-table-wrap p {
    margin: 0;
    line-height: 1.5;
  }

  .cert-sheet {
    box-sizing: border-box;
    width: 100%;
    padding: 10mm 12mm;
    overflow: visible;
    background: #fff;
  }

  .cert-main-title {
    font-family: SimSun, '宋体', serif;
    font-size: 19.2pt;
    vertical-align: top;
  }

  .table-no-border,
  .table-border {
    font-family: SimSun, '宋体', serif;
    font-size: 9.6pt;
    font-weight: 700;
    color: #000;
    text-align: center;
    border-collapse: collapse;
  }

  .table-border td {
    border: 0.5pt solid #000;
  }

  .table-no-border td,
  .table-no-border1 td {
    border: none;
  }

  td.f-row1 {
    padding-bottom: 3mm;
    text-align: left;
    vertical-align: bottom;
  }

  .side-column {
    width: 2%;
    overflow: visible;
    vertical-align: top;
    border: none !important;
  }

  .side-inner-table {
    width: 100%;
    height: 100%;

    td {
      text-align: right;
      border: none !important;
    }
  }

  .side-cell-top {
    height: 15mm;
    vertical-align: top;
  }

  .side-cell-mid {
    height: 15mm;
    vertical-align: top;
  }

  .side-cell-desc {
    height: 63mm;
  }

  .side-cell-bottom {
    height: 13mm;
  }

  .side-cell-six {
    height: 8mm;
  }

  .cert-footer-table {
    width: 100%;
    border-collapse: separate;
  }

  .ewm {
    width: 25%;
    height: 45mm;
    text-align: center;
    vertical-align: middle;
  }

  .cert-stamp-col {
    width: 40%;
    padding-top: 6mm;
    padding-left: 5pt;
    text-align: left;
    vertical-align: top;
    border-right: 0.5pt solid #000;
    border-left: 0.5pt solid #000;
  }

  .cert-stamp-title {
    margin-top: 5mm;
    font-size: 25px;
    text-align: center;
  }

  .cert-company-col {
    padding-top: 6mm;
    padding-left: 5pt;
    text-align: left;
    vertical-align: top;
  }

  .cert-handler {
    margin-top: 3mm;
  }

  .cert-note {
    padding: 3mm 2mm;
    font-size: 9pt;
    line-height: 1.5;
    text-align: left;
  }

  .cert-note-label {
    font-weight: 700;
  }

  .footer-company {
    margin-top: 5mm;
    font-size: 10pt;
    text-align: right;
  }
</style>
