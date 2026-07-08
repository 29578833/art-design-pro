<template>
  <ElDialog
    v-model="dialogVisible"
    width="780px"
    align-center
    destroy-on-close
    :show-close="false"
    class="order-create-dialog"
  >
    <!-- 提交成功 -->
    <template v-if="submitted">
      <div class="success-panel">
        <div class="success-icon-wrap">
          <ArtSvgIcon icon="ri:check-line" class="success-icon" />
        </div>
        <div class="success-title">提交成功</div>
        <div class="success-desc">
          收车订单已提交，等待审核
          <template v-if="form.is_batch && form.vehicles.length">
            （批次订单，已录入 {{ form.vehicles.length }} 辆）
          </template>
        </div>
        <div class="success-info">
          <div class="success-info-row">
            <span class="success-info-label">订单编号</span>
            <span class="success-info-value primary">{{ mockOrderNo }}</span>
          </div>
          <div class="success-info-row">
            <span class="success-info-label">订单类型</span>
            <span class="success-info-value">{{ form.is_batch ? '批次回收' : '单台回收' }}</span>
          </div>
          <div v-if="form.is_batch" class="success-info-row">
            <span class="success-info-label">已录入车辆</span>
            <span class="success-info-value">
              {{ form.vehicles.length }} 辆
              <span v-if="!form.vehicles.length" class="success-info-label">（后续补充）</span>
            </span>
          </div>
          <div class="success-info-row">
            <span class="success-info-label">当前状态</span>
            <span class="status-tag-pending">待审核</span>
          </div>
        </div>
        <button type="button" class="btn-confirm" @click="handleSuccessConfirm">确定</button>
      </div>
    </template>

    <template v-if="!submitted" #header>
      <div class="dialog-header">
        <div class="dialog-header-left">
          <span class="dialog-title">+ 创建订单</span>
          <div style="position: relative">
            <button type="button" class="header-btn" @click="showTemplates = !showTemplates">
              <ArtSvgIcon icon="ri:book-open-line" />
              使用模板
            </button>
            <div v-if="showTemplates" class="template-dropdown">
              <div
                v-for="tpl in mockTemplates"
                :key="tpl.id"
                class="template-item"
                @click="applyTemplate(tpl)"
              >
                {{ tpl.name }}
              </div>
            </div>
          </div>
        </div>
        <div class="dialog-header-right">
          <button type="button" class="header-btn" :disabled="saving" @click="handleSaveDraft">
            <ArtSvgIcon icon="ri:save-line" />
            {{ saving ? '保存中…' : '保存草稿' }}
          </button>
          <button type="button" class="header-btn" @click="dialogVisible = false">
            <ArtSvgIcon icon="ri:close-line" />
          </button>
        </div>
      </div>
    </template>

    <template v-if="!submitted">
      <!-- 步骤条 -->
      <div class="step-bar">
        <div class="step-list">
          <div v-for="(label, i) in stepLabels" :key="label" class="step-item">
            <div class="step-node">
              <div
                class="step-circle"
                :class="i < currentStep ? 'done' : i === currentStep ? 'active' : 'pending'"
              >
                <ArtSvgIcon v-if="i < currentStep" icon="ri:check-line" />
                <span v-else>{{ i + 1 }}</span>
              </div>
              <span
                class="step-label"
                :class="i < currentStep ? 'done' : i === currentStep ? 'active' : 'pending'"
              >
                {{ label }}
              </span>
            </div>
            <div
              v-if="i < stepLabels.length - 1"
              class="step-line"
              :class="i < currentStep ? 'done' : 'pending'"
            />
          </div>
        </div>
      </div>

      <!-- 步骤内容 -->
      <div class="dialog-body">
        <!-- Step 1: 基础信息 -->
        <div v-show="currentStep === 0" class="step-content">
          <!-- 订单类型 -->
          <div class="order-type-block">
            <div class="order-type-title">订单类型</div>
            <div class="order-type-cards">
              <button
                v-for="opt in orderTypeOptions"
                :key="String(opt.value)"
                type="button"
                class="order-type-card"
                :class="{ active: form.is_batch === opt.value }"
                @click="form.is_batch = opt.value"
              >
                <div class="order-type-card-head">
                  <div class="radio-dot" :class="{ active: form.is_batch === opt.value }" />
                  <span
                    class="order-type-card-label"
                    :class="{ active: form.is_batch === opt.value }"
                  >
                    {{ opt.label }}
                  </span>
                </div>
                <div class="order-type-card-desc">{{ opt.desc }}</div>
              </button>
            </div>
          </div>

          <!-- 行驶证识别 -->
          <input
            ref="ocrFileInputRef"
            type="file"
            accept="image/*"
            class="ocr-file-input"
            @change="handleOcrFileChange"
          />
          <div class="ocr-block" :class="ocrDone ? 'success' : 'default'">
            <div class="ocr-inner">
              <div style="flex: 1">
                <div class="ocr-text-title">
                  行驶证智能识别
                  <span class="ocr-text-hint">（可选）</span>
                </div>
                <div class="ocr-text-desc"
                  >上传行驶证图片，系统自动识别并填充车辆和回收用户信息</div
                >
              </div>
              <div v-if="ocrDone" class="ocr-success">
                <ArtSvgIcon icon="ri:check-line" />
                识别成功，已自动填充
              </div>
              <button
                v-else
                type="button"
                class="btn-ocr"
                :disabled="ocrLoading"
                @click="handleOcr"
              >
                <ArtSvgIcon v-if="!ocrLoading" icon="ri:camera-line" />
                {{ ocrLoading ? '识别中…' : '上传行驶证识别' }}
              </button>
            </div>
          </div>

          <!-- 客户信息 -->
          <div>
            <div class="section-header">
              <ArtSvgIcon icon="ri:user-line" style="color: #bfbfbf" />
              <span class="section-title">客户信息</span>
            </div>
            <div class="form-grid-2">
              <div class="col-span-2">
                <label class="field-label">选择客户<span class="required">*</span></label>
                <ElAutocomplete
                  v-model="form.real_name"
                  class="customer-autocomplete"
                  popper-class="order-customer-autocomplete-popper"
                  :fetch-suggestions="queryCustomers"
                  value-key="name"
                  placeholder="搜索客户姓名 / 手机号 / 编号"
                  :trigger-on-focus="true"
                  @select="handleCustomerSelect"
                >
                  <template #prefix>
                    <ArtSvgIcon icon="ri:search-line" class="customer-search-icon" />
                  </template>
                  <template #default="{ item }">
                    <div class="customer-option">
                      <div class="customer-avatar">{{ item.real_name.slice(0, 1) }}</div>
                      <div class="customer-info">
                        <div class="customer-name">{{ item.real_name }}</div>
                        <div class="customer-phone">{{ item.phone }}</div>
                      </div>
                      <span
                        class="customer-grade"
                        :style="{
                          color: gradeColor[item.grade],
                          background: `${gradeColor[item.grade]}20`
                        }"
                      >
                        {{ gradeLabel[item.grade] }}
                      </span>
                    </div>
                  </template>
                  <template #footer>
                    <button type="button" class="customer-add-btn">+ 新增客户</button>
                  </template>
                </ElAutocomplete>
              </div>
              <div>
                <label class="field-label">联系电话<span class="required">*</span></label>
                <ElInput v-model="form.phone" placeholder="手机号" />
              </div>
            </div>
          </div>

          <!-- 车辆信息 -->
          <div v-if="form.is_batch">
            <div class="section-header">
              <ArtSvgIcon icon="ri:car-line" style="color: #bfbfbf" />
              <span class="section-title">车辆档案（已添加 {{ form.vehicles.length }} 辆）</span>
              <div class="section-header-right">
                <button type="button" class="btn-add-inline" @click="addVehicle">
                  <ArtSvgIcon icon="ri:add-line" />
                  添加车辆
                </button>
              </div>
            </div>
            <div v-if="!form.vehicles.length" class="vehicle-empty">
              <ArtSvgIcon icon="ri:car-line" class="vehicle-empty-icon" />
              <div class="vehicle-empty-text">暂未添加车辆档案</div>
              <div class="vehicle-empty-hint"
                >点击"添加车辆"按钮录入车辆，或先提交订单后续编辑补充</div
              >
              <button type="button" class="btn-add-vehicle" @click="addVehicle">
                <ArtSvgIcon icon="ri:add-line" />
                添加第一辆车
              </button>
            </div>
            <div v-else class="step-content" style="gap: 12px">
              <div
                v-for="(vehicle, index) in form.vehicles"
                :key="vehicle._id"
                class="vehicle-card"
              >
                <div class="vehicle-card-head">
                  <div class="vehicle-card-index">
                    <div class="vehicle-index-badge">{{ index + 1 }}</div>
                    <span class="vehicle-card-title">车辆 {{ index + 1 }}</span>
                  </div>
                  <button type="button" class="btn-remove" @click="removeVehicle(index)">
                    <ArtSvgIcon icon="ri:delete-bin-line" />
                  </button>
                </div>
                <div class="form-grid-3">
                  <div>
                    <label class="field-label">车牌号<span class="required">*</span></label>
                    <ElInput v-model="vehicle.plate_no" placeholder="如：京A·12345" />
                  </div>
                  <div>
                    <label class="field-label">车辆型号</label>
                    <ElInput v-model="vehicle.model" placeholder="如：大众帕萨特" />
                  </div>
                  <div>
                    <label class="field-label">车架号(VIN)</label>
                    <ElInput v-model="vehicle.vin" placeholder="17位字符" maxlength="17" />
                  </div>
                  <div>
                    <label class="field-label">燃料类型</label>
                    <ElSelect v-model="vehicle.vehicle_type" placeholder="请选择">
                      <ElOption v-for="t in fuelTypes" :key="t" :label="t" :value="t" />
                    </ElSelect>
                  </div>
                  <div>
                    <label class="field-label">排放标准</label>
                    <ElSelect v-model="vehicle.emission_standard" placeholder="请选择">
                      <ElOption v-for="s in emissionStandards" :key="s" :label="s" :value="s" />
                    </ElSelect>
                  </div>
                  <div>
                    <label class="field-label">初次登记日期</label>
                    <ElDatePicker
                      v-model="vehicle.registration_date"
                      type="date"
                      value-format="YYYY-MM-DD"
                      placeholder="选择日期"
                    />
                  </div>
                </div>
              </div>
              <button type="button" class="btn-add-vehicle-outline" @click="addVehicle">
                <ArtSvgIcon icon="ri:add-line" />
                继续添加车辆
              </button>
            </div>
          </div>

          <div v-else>
            <div class="section-header">
              <ArtSvgIcon icon="ri:car-line" style="color: #bfbfbf" />
              <span class="section-title">车辆信息</span>
            </div>
            <div class="form-grid-2">
              <div>
                <label class="field-label">车牌号<span class="required">*</span></label>
                <ElInput v-model="form.plate_no" placeholder="如：沪A·12345" />
              </div>
              <div>
                <label class="field-label">VIN码（车架号）</label>
                <ElInput v-model="form.vin" placeholder="17位车架号" maxlength="17" />
              </div>
              <div>
                <label class="field-label">车辆品牌</label>
                <ElSelect v-model="form.brand" placeholder="请选择">
                  <ElOption v-for="b in vehicleBrands" :key="b" :label="b" :value="b" />
                </ElSelect>
              </div>
              <div>
                <label class="field-label">车系/型号</label>
                <ElInput v-model="form.model" placeholder="如：帕萨特2020款" />
              </div>
              <div>
                <label class="field-label">燃料类型</label>
                <ElSelect v-model="form.vehicle_type">
                  <ElOption v-for="t in fuelTypes" :key="t" :label="t" :value="t" />
                </ElSelect>
              </div>
              <div>
                <label class="field-label">排放标准</label>
                <ElSelect v-model="form.emission_standard" placeholder="请选择">
                  <ElOption v-for="s in emissionStandards" :key="s" :label="s" :value="s" />
                </ElSelect>
              </div>
              <div>
                <label class="field-label">车身颜色</label>
                <ElInput v-model="form.color" placeholder="如：珍珠白" />
              </div>
              <div>
                <label class="field-label">出厂年份</label>
                <ElInput v-model="form.year" placeholder="如：2019" />
              </div>
              <div>
                <label class="field-label">表显里程（万公里）</label>
                <ElInput v-model="form.mileage" type="number" placeholder="如：12.5" />
              </div>
              <div>
                <label class="field-label">初次登记日期</label>
                <ElDatePicker
                  v-model="form.registration_date"
                  type="date"
                  value-format="YYYY-MM-DD"
                  placeholder="选择日期"
                />
              </div>
            </div>
          </div>

          <!-- 回收用户信息 -->
          <div class="owner-block">
            <div class="owner-block-title">回收用户信息</div>
            <div class="form-grid-3">
              <div>
                <label class="field-label">姓名</label>
                <ElInput v-model="form.owner_name" placeholder="车主/送车人姓名" />
              </div>
              <div>
                <label class="field-label">联系电话</label>
                <ElInput v-model="form.owner_phone" placeholder="手机号" />
              </div>
              <div>
                <label class="field-label">居住地址</label>
                <ElInput v-model="form.owner_address" placeholder="省市区+详细地址" />
              </div>
            </div>
          </div>

          <!-- 交付方式 -->
          <div>
            <div class="section-header">
              <span class="section-title">交付方式</span>
            </div>
            <div class="option-cards">
              <button
                v-for="opt in deliveryOptions"
                :key="opt.value"
                type="button"
                class="option-card"
                :class="{ active: form.delivery_type === opt.value }"
                @click="form.delivery_type = opt.value"
              >
                <div
                  class="option-card-label"
                  :class="{ active: form.delivery_type === opt.value }"
                >
                  {{ opt.label }}
                </div>
                <div class="option-card-desc">{{ opt.desc }}</div>
              </button>
            </div>
            <div v-if="form.delivery_type === 'tow'" class="pickup-block form-grid-2">
              <div class="col-span-2">
                <label class="field-label">取车地址<span class="required">*</span></label>
                <ElInput v-model="form.pickup_address" placeholder="详细取车地址" />
              </div>
              <div>
                <label class="field-label">取车联系人<span class="required">*</span></label>
                <ElInput v-model="form.pickup_contact" placeholder="联系人姓名" />
              </div>
              <div>
                <label class="field-label">联系电话<span class="required">*</span></label>
                <ElInput v-model="form.pickup_phone" placeholder="联系手机号" />
              </div>
            </div>
          </div>
        </div>

        <!-- Step 2: 结算信息 -->
        <div v-show="currentStep === 1" class="step-content">
          <div>
            <div class="section-header">
              <span class="section-title">结算方式</span>
            </div>
            <div class="option-cards-3">
              <button
                v-for="opt in settlementMethodOptions"
                :key="opt.value"
                type="button"
                class="option-card"
                :class="{ active: form.settlement_method === opt.value }"
                @click="selectSettlementMethod(opt.value)"
              >
                <div
                  class="option-card-label"
                  :class="{ active: form.settlement_method === opt.value }"
                >
                  {{ opt.label }}
                </div>
                <div class="option-card-desc">{{ opt.desc }}</div>
              </button>
            </div>
            <div class="residual-block">
              <label class="field-label">
                残值（{{ residualUnit }}）<span class="required">*</span>
              </label>
              <div class="residual-input-wrap">
                <ElInput
                  v-model="form.residual_value"
                  type="number"
                  placeholder="请输入金额"
                  :min="0"
                />
                <span class="unit-suffix">{{ residualUnit }}</span>
              </div>
            </div>
          </div>

          <div>
            <div class="section-header">
              <span class="section-title">结算信息</span>
            </div>
            <div class="form-grid-2">
              <div>
                <label class="field-label">自送费补贴（元）</label>
                <ElInput
                  v-model="form.self_delivery_subsidy"
                  type="number"
                  placeholder="0"
                  :min="0"
                />
              </div>
              <div class="deduct-block">
                <ElCheckbox v-model="form.no_deduct_missing" />
                <label class="deduct-label">
                  质检缺件免扣款
                  <span class="deduct-hint">勾选后缺件不计入扣款</span>
                </label>
              </div>
            </div>
          </div>

          <div>
            <div class="section-header">
              <span class="section-title">代理人信息</span>
              <div class="section-header-right">
                <label class="agent-toggle">
                  <ElCheckbox v-model="form.has_agent" />
                  有代理人
                </label>
              </div>
            </div>
            <div v-if="form.has_agent" class="agent-block form-grid-2">
              <div>
                <label class="field-label">代理人姓名<span class="required">*</span></label>
                <ElInput v-model="form.agent_name" placeholder="代理人姓名" />
              </div>
              <div>
                <label class="field-label">代理人手机<span class="required">*</span></label>
                <ElInput v-model="form.agent_phone" placeholder="手机号" />
              </div>
              <div>
                <label class="field-label">代理服务费（元）<span class="required">*</span></label>
                <ElInput v-model="form.agent_fee" type="number" placeholder="0" :min="0" />
              </div>
              <div>
                <label class="field-label">代理服务费发票</label>
                <ElInput v-model="form.agent_invoice_no" placeholder="发票号码" />
              </div>
            </div>
          </div>
        </div>

        <!-- Step 3: 收款发票 -->
        <div v-show="currentStep === 2" class="step-content">
          <div>
            <div class="section-header">
              <span class="section-title">客户性质</span>
            </div>
            <div class="option-cards">
              <button
                v-for="opt in enterpriseOptions"
                :key="String(opt.value)"
                type="button"
                class="option-card"
                :class="{ active: form.is_enterprise === opt.value }"
                @click="form.is_enterprise = opt.value"
              >
                <div
                  class="option-card-label"
                  :class="{ active: form.is_enterprise === opt.value }"
                >
                  {{ opt.label }}
                </div>
              </button>
            </div>
            <div v-if="form.is_enterprise" class="pickup-block form-grid-2">
              <div class="col-span-2">
                <label class="field-label">企业名称<span class="required">*</span></label>
                <ElInput v-model="form.enterprise_name" placeholder="营业执照上的企业全称" />
              </div>
              <div>
                <label class="field-label">发票金额（元）</label>
                <ElInput v-model="form.invoice_amount" type="number" placeholder="开票金额" />
              </div>
              <div>
                <label class="field-label">发票号码</label>
                <ElInput v-model="form.invoice_no" placeholder="发票编号" />
              </div>
            </div>
          </div>

          <div>
            <div class="section-header">
              <span class="section-title">收款账户</span>
            </div>
            <div class="form-grid-2">
              <div>
                <label class="field-label">开户姓名/名称<span class="required">*</span></label>
                <ElInput v-model="form.account_name" placeholder="与银行卡一致" />
              </div>
              <div>
                <label class="field-label">开户银行<span class="required">*</span></label>
                <ElInput v-model="form.bank_name" placeholder="如：中国工商银行上海分行" />
              </div>
              <div class="col-span-2">
                <label class="field-label">银行卡号<span class="required">*</span></label>
                <ElInput
                  v-model="form.bank_card"
                  placeholder="银行卡号（16-19位）"
                  maxlength="19"
                />
              </div>
            </div>
          </div>

          <div>
            <label class="field-label">备注说明</label>
            <ElInput
              v-model="form.remark"
              type="textarea"
              :rows="3"
              placeholder="订单备注信息（内部使用，不对外显示）"
              resize="none"
            />
          </div>

          <div class="template-save-block">
            <div class="template-save-head">
              <ArtSvgIcon icon="ri:save-line" style="color: #bfbfbf" />
              <span class="template-save-title">保存为订单模板</span>
              <span class="template-save-hint">（下次可快速复用）</span>
            </div>
            <ElInput v-model="form.template_name" placeholder="模板名称（如留空则不保存）" />
          </div>

          <div class="confirm-summary">
            <div class="confirm-summary-title">
              <ArtSvgIcon icon="ri:error-warning-line" />
              订单信息确认
            </div>
            <div class="confirm-summary-grid">
              <div>
                客户：<span class="value">{{ form.real_name || '—' }}</span>
              </div>
              <div>
                <template v-if="form.is_batch">
                  批次车辆：<span class="value">{{
                    form.vehicles.length ? `已录入 ${form.vehicles.length} 辆` : '待录入'
                  }}</span>
                </template>
                <template v-else>
                  车牌：<span class="value">{{ form.plate_no || '—' }}</span>
                </template>
              </div>
              <div>
                交付方式：<span class="value">{{
                  form.delivery_type === 'tow' ? '预约拖车' : '自行送厂'
                }}</span>
              </div>
              <div>
                结算方式：<span class="value">{{ settlementMethodLabel }}</span>
              </div>
              <div>
                免缺件扣款：<span class="value">{{ form.no_deduct_missing ? '是' : '否' }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <template v-if="!submitted" #footer>
      <div class="dialog-footer">
        <div class="footer-step-hint">步骤 {{ currentStep + 1 }} / {{ stepLabels.length }}</div>
        <div class="footer-actions">
          <button type="button" class="btn-cancel" @click="dialogVisible = false">取消</button>
          <button v-if="currentStep > 0" type="button" class="btn-prev" @click="currentStep--">
            <ArtSvgIcon icon="ri:arrow-left-s-line" />
            上一步
          </button>
          <button
            v-if="currentStep < stepLabels.length - 1"
            type="button"
            class="btn-next"
            :disabled="!canNext"
            @click="currentStep++"
          >
            下一步
            <ArtSvgIcon icon="ri:arrow-right-s-line" />
          </button>
          <button
            v-else
            type="button"
            class="btn-submit"
            :disabled="!canNext || saving"
            @click="handleSubmit"
          >
            <ArtSvgIcon icon="ri:check-line" />
            {{ saving ? '提交中…' : '提交订单' }}
          </button>
        </div>
      </div>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import {
    extractYearFromRegDate,
    parseEmissionStandardFromOcr,
    parseFuelTypeFromOcr,
    recognizeDrivingLicenseByFile
  } from '@/api/recycle/ocr'
  import { fetchPartnerList } from '@/api/recycle/customer'
  import { fetchSaveOrder } from '@/api/recycle/order'
  import type { DrivingLicenseOcrData } from '@/types/recycle/ocr'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import type { OrderSavePayload, RecycleOrder } from '@/types/recycle/order'

  interface VehicleFormItem {
    _id: string
    plate_no: string
    vehicle_type: string
    emission_standard: string
    model: string
    vin: string
    registration_date: string
  }

  interface OrderCreateForm {
    is_batch: boolean
    plate_no: string
    vin: string
    brand: string
    model: string
    vehicle_type: string
    emission_standard: string
    color: string
    year: string
    mileage: string
    registration_date: string
    vehicles: VehicleFormItem[]
    owner_name: string
    owner_phone: string
    owner_address: string
    uid: number
    real_name: string
    phone: string
    delivery_type: 'self' | 'tow'
    pickup_address: string
    pickup_contact: string
    pickup_phone: string
    settlement_method: 'weight' | 'gross_weight' | 'whole_vehicle'
    residual_value: string
    self_delivery_subsidy: string
    no_deduct_missing: boolean
    has_agent: boolean
    agent_name: string
    agent_phone: string
    agent_fee: string
    agent_invoice_no: string
    is_enterprise: boolean
    enterprise_name: string
    invoice_amount: string
    invoice_no: string
    account_name: string
    bank_name: string
    bank_card: string
    remark: string
    template_name: string
  }

  interface CustomerOption {
    uid: number
    real_name: string
    phone: string
    grade: string
  }

  interface MockTemplate {
    id: string
    name: string
    settlement_method: OrderCreateForm['settlement_method']
    delivery_type: OrderCreateForm['delivery_type']
    self_delivery_subsidy: string
  }

  interface Props {
    visible: boolean
    /** 从线索创建时可传入预填数据 */
    prefillOrder?: RecycleOrder | null
  }

  interface Emits {
    (e: 'update:visible', value: boolean): void
    (e: 'submit'): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  const stepLabels = ['基础信息', '结算信息', '收款发票']
  const currentStep = ref(0)
  const submitted = ref(false)
  const saving = ref(false)
  const ocrLoading = ref(false)
  const ocrDone = ref(false)
  const ocrFileInputRef = ref<HTMLInputElement>()
  let ocrDoneTimer: ReturnType<typeof setTimeout> | null = null
  const showTemplates = ref(false)
  const mockOrderNo = ref('')

  const vehicleBrands = [
    '大众',
    '丰田',
    '本田',
    '宝马',
    '奔驰',
    '奥迪',
    '现代',
    '别克',
    '雪佛兰',
    '福特',
    '比亚迪',
    '特斯拉'
  ]
  const fuelTypes = ['汽油', '柴油', '纯电动', '插电混动', '油电混动']
  const emissionStandards = ['国一', '国二', '国三', '国四', '国五', '国六', '新能源']

  const mockTemplates: MockTemplate[] = [
    {
      id: 'T001',
      name: '个人报废-重量结算模板',
      settlement_method: 'weight',
      delivery_type: 'tow',
      self_delivery_subsidy: '0'
    },
    {
      id: 'T002',
      name: '企业卖废铁-现金模板',
      settlement_method: 'weight',
      delivery_type: 'self',
      self_delivery_subsidy: '500'
    },
    {
      id: 'T003',
      name: '个人自送-固定价格模板',
      settlement_method: 'whole_vehicle',
      delivery_type: 'self',
      self_delivery_subsidy: '300'
    }
  ]

  const gradeColor: Record<string, string> = {
    vip: '#D4AF37',
    normal: '#1890FF',
    potential: '#8C8C8C'
  }

  const gradeLabel: Record<string, string> = {
    vip: 'VIP',
    normal: '普通',
    potential: '潜在'
  }

  const orderTypeOptions = [
    { value: false, label: '单台回收', desc: '一张订单对应一辆车' },
    { value: true, label: '批次回收', desc: '一张订单关联多辆车档案' }
  ]

  const deliveryOptions = [
    { value: 'tow' as const, label: '预约拖车', desc: '上门取车服务' },
    { value: 'self' as const, label: '自行送厂', desc: '客户自行送达' }
  ]

  const settlementMethodOptions = [
    { value: 'weight' as const, label: '重量结算', desc: '按净重（吨）计算' },
    { value: 'gross_weight' as const, label: '整备质量结算', desc: '按整备质量（辆）计算' },
    { value: 'whole_vehicle' as const, label: '整车结算', desc: '按整车固定价格计算' }
  ]

  const enterpriseOptions = [
    { value: false, label: '个人车主' },
    { value: true, label: '企业客户' }
  ]

  const defaultForm = (): OrderCreateForm => ({
    is_batch: false,
    plate_no: '',
    vin: '',
    brand: '',
    model: '',
    vehicle_type: '汽油',
    emission_standard: '',
    color: '',
    year: '',
    mileage: '',
    registration_date: '',
    vehicles: [],
    owner_name: '',
    owner_phone: '',
    owner_address: '',
    uid: 0,
    real_name: '',
    phone: '',
    delivery_type: 'tow',
    pickup_address: '',
    pickup_contact: '',
    pickup_phone: '',
    settlement_method: 'weight',
    residual_value: '',
    self_delivery_subsidy: '',
    no_deduct_missing: false,
    has_agent: false,
    agent_name: '',
    agent_phone: '',
    agent_fee: '',
    agent_invoice_no: '',
    is_enterprise: false,
    enterprise_name: '',
    invoice_amount: '',
    invoice_no: '',
    account_name: '',
    bank_name: '',
    bank_card: '',
    remark: '',
    template_name: ''
  })

  const form = ref<OrderCreateForm>(defaultForm())

  const dialogVisible = computed({
    get: () => props.visible,
    set: (val) => emit('update:visible', val)
  })

  const filteredCustomers = async (queryString: string): Promise<CustomerOption[]> => {
    const res = await fetchPartnerList({
      keyword: queryString.trim(),
      current: 1,
      size: 20
    })
    return res.records.map((item) => ({
      uid: Number(item.id),
      real_name: item.name,
      phone: item.phone,
      grade: item.grade
    }))
  }

  async function queryCustomers(queryString: string, cb: (results: CustomerOption[]) => void) {
    try {
      cb(await filteredCustomers(queryString))
    } catch {
      cb([])
    }
  }

  function toNumber(value: string | number | undefined) {
    const num = Number(value)
    return Number.isFinite(num) ? num : 0
  }

  function buildVehicles() {
    if (form.value.is_batch) {
      return form.value.vehicles
        .filter((item) => item.plate_no || item.vin)
        .map((item) => ({
          plate_no: item.plate_no,
          vin: item.vin,
          model: item.model,
          fuel_type: item.vehicle_type,
          emission_standard: item.emission_standard,
          reg_date: item.registration_date
        }))
    }

    if (!form.value.plate_no && !form.value.vin) return []

    return [
      {
        plate_no: form.value.plate_no,
        vin: form.value.vin,
        brand: form.value.brand,
        model: form.value.model,
        fuel_type: form.value.vehicle_type,
        emission_standard: form.value.emission_standard,
        reg_date: form.value.registration_date,
        color: form.value.color,
        mileage: form.value.mileage
      }
    ]
  }

  function buildSavePayload(status = 1): OrderSavePayload {
    const vehicles = buildVehicles()

    return {
      is_batch: form.value.is_batch ? 1 : 0,
      status,
      batch_vehicle_count: form.value.is_batch ? vehicles.length : 0,
      real_name: form.value.real_name.trim(),
      phone: form.value.phone.trim(),
      address: form.value.owner_address || '',
      delivery_type: form.value.delivery_type,
      pickup_contact_name: form.value.delivery_type === 'tow' ? form.value.pickup_contact : '',
      pickup_contact_phone: form.value.delivery_type === 'tow' ? form.value.pickup_phone : '',
      pickup_address: form.value.delivery_type === 'tow' ? form.value.pickup_address : '',
      settlement_method: form.value.settlement_method,
      deduct_missing: form.value.no_deduct_missing ? 0 : 1,
      self_delivery_subsidy: toNumber(form.value.self_delivery_subsidy),
      unit_price: toNumber(form.value.residual_value),
      settlement_amount: toNumber(form.value.residual_value),
      owner_type: form.value.is_enterprise ? 'non_personal' : 'personal',
      has_agent: form.value.has_agent ? 1 : 0,
      agent_name: form.value.agent_name,
      agent_phone: form.value.agent_phone,
      agent_fee: toNumber(form.value.agent_fee),
      agent_invoice_no: form.value.agent_invoice_no,
      bank_account_name: form.value.account_name,
      bank_name: form.value.bank_name,
      bank_card_number: form.value.bank_card,
      vehicles,
      remark: form.value.remark,
      uid: form.value.uid || 0
    }
  }

  const residualUnit = computed(() =>
    form.value.settlement_method === 'weight' ? '元/吨' : '元/辆'
  )

  const settlementMethodLabel = computed(() => {
    const map: Record<string, string> = {
      weight: '重量结算',
      gross_weight: '整备质量结算',
      whole_vehicle: '整车结算'
    }
    return map[form.value.settlement_method] || '—'
  })

  const canNext = computed(() => {
    if (currentStep.value === 0) {
      return !!(form.value.real_name && (form.value.is_batch || form.value.plate_no))
    }
    if (currentStep.value === 1) {
      return !!form.value.settlement_method
    }
    return !!(form.value.account_name && form.value.bank_name && form.value.bank_card)
  })

  function resetState() {
    currentStep.value = 0
    submitted.value = false
    saving.value = false
    ocrLoading.value = false
    ocrDone.value = false
    showTemplates.value = false
    form.value = defaultForm()
  }

  function prefillFromOrder(order: RecycleOrder) {
    form.value.real_name = order.real_name || ''
    form.value.phone = order.phone || ''
    form.value.uid = Number(order.uid) || 0
    form.value.plate_no = order.plate_no || ''
    form.value.vin = order.vin || ''
    form.value.brand = order.brand || ''
    form.value.model = order.model || ''
    form.value.is_batch = order.is_batch === 1
    form.value.owner_address = String(order.address || '')
  }

  function newVehicle(): VehicleFormItem {
    return {
      _id: Date.now().toString(),
      plate_no: '',
      vehicle_type: '',
      emission_standard: '',
      model: '',
      vin: '',
      registration_date: ''
    }
  }

  function addVehicle() {
    form.value.vehicles.push(newVehicle())
  }

  function removeVehicle(index: number) {
    form.value.vehicles.splice(index, 1)
  }

  function handleCustomerSelect(item: CustomerOption) {
    form.value.uid = item.uid
    form.value.real_name = item.real_name
    form.value.phone = item.phone
  }

  function applyTemplate(tpl: MockTemplate) {
    form.value.settlement_method = tpl.settlement_method
    form.value.delivery_type = tpl.delivery_type
    form.value.self_delivery_subsidy = tpl.self_delivery_subsidy
    showTemplates.value = false
  }

  function selectSettlementMethod(value: OrderCreateForm['settlement_method']) {
    form.value.settlement_method = value
    form.value.residual_value = ''
  }

  function applyOcrResult(data: DrivingLicenseOcrData) {
    const fuelType = parseFuelTypeFromOcr(data)
    const emissionStandard = parseEmissionStandardFromOcr(data)
    const registrationDate = data.reg_date || ''
    const year = extractYearFromRegDate(registrationDate)

    if (form.value.is_batch) {
      const vehicle = form.value.vehicles[0] || newVehicle()
      if (data.plate_no) vehicle.plate_no = data.plate_no
      if (data.vin) vehicle.vin = data.vin
      if (data.model) vehicle.model = data.model
      if (fuelType) vehicle.vehicle_type = fuelType
      if (emissionStandard) vehicle.emission_standard = emissionStandard
      if (registrationDate) vehicle.registration_date = registrationDate

      if (!form.value.vehicles.length) {
        form.value.vehicles.push(vehicle)
      }
    } else {
      if (data.plate_no) form.value.plate_no = data.plate_no
      if (data.vin) form.value.vin = data.vin
      if (data.model) form.value.model = data.model
      if (data.brand) form.value.brand = data.brand
      if (fuelType) form.value.vehicle_type = fuelType
      if (emissionStandard) form.value.emission_standard = emissionStandard
      if (registrationDate) {
        form.value.registration_date = registrationDate
        if (year) form.value.year = year
      }
    }

    if (data.owner_name) form.value.owner_name = data.owner_name
    if (data.address) form.value.owner_address = data.address
  }

  function handleOcr() {
    ocrFileInputRef.value?.click()
  }

  async function handleOcrFileChange(event: Event) {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    input.value = ''

    if (!file) return
    if (!file.type.startsWith('image/')) {
      ElMessage.warning('请上传图片格式的行驶证')
      return
    }

    ocrLoading.value = true
    try {
      const result = await recognizeDrivingLicenseByFile(file)
      applyOcrResult(result.data!)
      ocrDone.value = true
      if (ocrDoneTimer) clearTimeout(ocrDoneTimer)
      ocrDoneTimer = setTimeout(() => {
        ocrDone.value = false
      }, 3000)
    } catch {
      // 错误提示由 http 层统一处理
    } finally {
      ocrLoading.value = false
    }
  }

  async function handleSaveDraft() {
    if (!form.value.real_name || !form.value.phone) {
      ElMessage.warning('请先填写客户姓名和联系电话')
      return
    }

    saving.value = true
    try {
      await fetchSaveOrder(buildSavePayload(0))
      ElMessage.success('草稿已保存')
    } finally {
      saving.value = false
    }
  }

  async function handleSubmit() {
    if (!form.value.real_name || !form.value.phone) {
      ElMessage.warning('请填写客户姓名和联系电话')
      return
    }

    saving.value = true
    try {
      const res = await fetchSaveOrder(buildSavePayload(1))
      mockOrderNo.value = res.order_no || String(res.id || '')
      submitted.value = true
    } finally {
      saving.value = false
    }
  }

  function handleSuccessConfirm() {
    dialogVisible.value = false
    emit('submit')
  }

  watch(
    () => props.visible,
    (visible) => {
      if (!visible) return
      resetState()
      if (props.prefillOrder) {
        prefillFromOrder(props.prefillOrder)
      }
    }
  )
</script>

<style scoped lang="scss">
  @use './order-create-dialog';
</style>

<style lang="scss">
  /* 下拉层 teleport 到 body，需非 scoped — 对齐 CreateOrderWizard CustomerSelector */
  .order-customer-autocomplete-popper.el-autocomplete__popper {
    overflow: hidden;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    box-shadow:
      0 10px 15px -3px rgb(0 0 0 / 10%),
      0 4px 6px -4px rgb(0 0 0 / 10%);
  }

  .order-customer-autocomplete-popper {
    .el-autocomplete-suggestion {
      border-radius: 8px;
    }

    .el-autocomplete-suggestion__wrap {
      max-height: 192px;
      padding: 0;
    }

    .el-autocomplete-suggestion__list {
      margin: 0;
    }

    .el-autocomplete-suggestion li {
      padding: 10px 12px;
      line-height: normal;
      cursor: pointer;
      border-bottom: 1px solid #fafafa;

      &:last-child {
        border-bottom: none;
      }

      &.highlighted,
      &:hover {
        background: #fafafa;
      }
    }

    .customer-option {
      display: flex;
      gap: 12px;
      align-items: center;
      width: 100%;
    }

    .customer-avatar {
      display: flex;
      flex-shrink: 0;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      font-size: 12px;
      font-weight: 500;
      color: #fff;
      background: #1890ff;
      border-radius: 50%;
    }

    .customer-info {
      flex: 1;
      min-width: 0;
    }

    .customer-name {
      font-size: 14px;
      font-weight: 500;
      line-height: 1.4;
      color: #1f2937;
    }

    .customer-phone {
      font-size: 12px;
      line-height: 1.4;
      color: #9ca3af;
    }

    .customer-grade {
      flex-shrink: 0;
      padding: 2px 6px;
      font-size: 12px;
      line-height: 1.4;
      border-radius: 12px;
    }

    .el-autocomplete-suggestion__footer {
      padding: 8px 12px;
      border-top: 1px solid #f0f0f0;
    }

    .customer-add-btn {
      padding: 0;
      font-size: 12px;
      color: #1890ff;
      cursor: pointer;
      background: transparent;
      border: none;

      &:hover {
        text-decoration: underline;
      }
    }
  }
</style>
