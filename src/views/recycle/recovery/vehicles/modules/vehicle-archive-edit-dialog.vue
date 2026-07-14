<template>
  <ElDialog
    v-model="dialogVisible"
    :width="phase === 'scene' ? '500px' : '1100px'"
    align-center
    destroy-on-close
    class="vehicle-archive-edit-dialog"
    :close-on-click-modal="false"
    :show-close="true"
    @closed="handleClosed"
  >
    <template #header>
      <div v-if="phase === 'scene'" class="ae-title">车辆受理新增</div>
      <div v-else class="ae-header">
        <div class="ae-title">编辑车辆档案</div>
        <div class="ae-tags">
          <span class="ae-tag blue">{{ hplxLabel }}</span>
          <span class="ae-tag" :class="isPersonal ? 'orange' : 'purple'">{{ syqLabel }}</span>
        </div>
      </div>
    </template>

    <!-- 场景选择 -->
    <div v-if="phase === 'scene'" class="ae-scene">
      <div class="ae-scene-group">
        <div class="ae-scene-title">车辆属地 *</div>
        <div class="ae-scene-grid cols-3">
          <button
            v-for="item in hplxOptions"
            :key="item.value"
            type="button"
            class="ae-scene-card"
            :class="{ active: hplx === item.value }"
            @click="hplx = item.value"
          >
            <div class="name">{{ item.label }}</div>
            <div class="desc">{{ item.desc }}</div>
          </button>
        </div>
      </div>
      <div class="ae-scene-group">
        <div class="ae-scene-title">所有权类型 *</div>
        <div class="ae-scene-grid cols-2">
          <button
            v-for="item in syqOptions"
            :key="item.value"
            type="button"
            class="ae-scene-card"
            :class="{ active: syq === item.value }"
            @click="syq = item.value"
          >
            <div class="name">{{ item.label }}</div>
            <div class="desc">{{ item.desc }}</div>
          </button>
        </div>
      </div>
      <div class="ae-scene-summary">
        当前场景：
        <b>{{ hplxLabel }} · {{ syqLabel }}</b>
      </div>
    </div>

    <!-- 多步编辑 -->
    <div v-else class="ae-form-wrap">
      <div class="ae-step-bar">
        <template v-for="(s, i) in visibleSteps" :key="s.id">
          <button type="button" class="ae-step-item" @click="goToStep(s.id)">
            <span class="ae-step-num" :class="{ cur: step === s.id, done: stepComplete[s.id - 1] }">
              {{ stepComplete[s.id - 1] ? '✓' : i + 1 }}
            </span>
            <span
              class="ae-step-label"
              :class="{ cur: step === s.id, done: stepComplete[s.id - 1] }"
            >
              {{ s.label }}
            </span>
          </button>
          <div
            v-if="i < visibleSteps.length - 1"
            class="ae-step-line"
            :class="{ done: stepComplete[s.id - 1] }"
          />
        </template>
      </div>

      <div class="ae-meta-bar">
        <div>
          <span class="ae-meta-label">车辆属地：</span>
          <span class="ae-meta-value">{{ hplxLabel }}</span>
        </div>
        <div>
          <span class="ae-meta-label">所有权：</span>
          <span class="ae-meta-value">{{ syqLabel }}</span>
        </div>
        <div>
          <span class="ae-meta-label">受理时间：</span>
          <span class="ae-meta-value">{{ acceptTime }}</span>
        </div>
        <div>
          <span class="ae-meta-label">受理人：</span>
          <span class="ae-meta-value">当前用户</span>
        </div>
      </div>

      <div class="ae-link-bar">
        <div>
          <span class="ae-link-label">关联回收订单号</span>
          <span v-if="linkInfo.order_no" class="ae-link-chip">{{ linkInfo.order_no }}</span>
          <span v-else class="ae-link-chip empty">未关联</span>
        </div>
        <div>
          <span class="ae-link-label">车辆档案单号</span>
          <span v-if="linkInfo.archive_no" class="ae-link-chip gray">{{
            linkInfo.archive_no
          }}</span>
          <span v-else class="ae-link-chip empty">待生成</span>
        </div>
        <div>
          <span class="ae-link-label">拖车订单号</span>
          <span v-if="linkInfo.tow_order_no" class="ae-link-chip gray">{{
            linkInfo.tow_order_no
          }}</span>
          <span v-else class="ae-link-chip empty">无拖车单</span>
        </div>
        <div>
          <span class="ae-link-label">线索单号</span>
          <span v-if="linkInfo.lead_no" class="ae-link-chip gray">{{ linkInfo.lead_no }}</span>
          <span v-else class="ae-link-chip empty">无线索单</span>
        </div>
      </div>

      <div v-loading="loading" class="ae-body">
        <!-- Step1 所有人 -->
        <template v-if="step === 1">
          <div class="ae-ocr-box">
            <div class="ae-ocr-head">
              <ArtSvgIcon icon="ri:qr-scan-2-line" />
              证件照片上传 & OCR智能识别
              <span class="ae-ocr-tip">— 点击各照片格的 OCR识别 按钮，自动填充下方字段</span>
            </div>
            <div class="ae-ocr-grid">
              <template v-if="isCompany">
                <UploadSlot
                  label="营业执照原件"
                  required
                  enable-ocr
                  ocr-hint="企业全称·统一社会信用代码…"
                  :url="ownerImages.syrzp"
                  :ocr-loading="!!ocrLoading.license"
                  :ocr-done="!!ocrDone.license"
                  :readonly="isSubmitted"
                  @upload="(f) => handleOwnerUpload('syrzp', f)"
                  @remove="() => handleOwnerRemove('syrzp')"
                  @ocr="runLicenseOcr"
                />
                <UploadSlot
                  label="缺失情况说明"
                  :url="ownerImages.qksmzp"
                  :readonly="isSubmitted"
                  @upload="(f) => handleOwnerUpload('qksmzp', f)"
                  @remove="() => handleOwnerRemove('qksmzp')"
                />
              </template>
              <template v-else>
                <UploadSlot
                  label="身份证正面"
                  required
                  enable-ocr
                  ocr-hint="所有人姓名·身份证号码…"
                  :url="ownerImages.sfz1zp || ownerImages.syrzp"
                  :ocr-loading="!!ocrLoading.id_front"
                  :ocr-done="!!ocrDone.id_front"
                  :readonly="isSubmitted"
                  @upload="(f) => handleOwnerUpload('sfz1zp', f)"
                  @remove="() => handleOwnerRemove('sfz1zp')"
                  @ocr="() => runIdCardOcr('front')"
                />
                <UploadSlot
                  label="身份证反面"
                  required
                  enable-ocr
                  ocr-hint="身份证号码（核验）"
                  ocr-filled-text="已核验"
                  :url="ownerImages.sfz2zp"
                  :ocr-loading="!!ocrLoading.id_back"
                  :ocr-done="!!ocrDone.id_back"
                  :readonly="isSubmitted"
                  @upload="(f) => handleOwnerUpload('sfz2zp', f)"
                  @remove="() => handleOwnerRemove('sfz2zp')"
                  @ocr="() => runIdCardOcr('back')"
                />
                <UploadSlot
                  label="缺失情况说明"
                  :url="ownerImages.qksmzp"
                  :readonly="isSubmitted"
                  @upload="(f) => handleOwnerUpload('qksmzp', f)"
                  @remove="() => handleOwnerRemove('qksmzp')"
                />
              </template>
            </div>
            <div v-if="ownerOcrFilled" class="ae-ocr-ok">
              <ArtSvgIcon icon="ri:checkbox-circle-line" />
              OCR已识别，以下字段已自动填充，请核对后继续
            </div>
          </div>

          <div class="ae-section">
            <div class="ae-section-title">所有人信息</div>
            <ElForm label-position="top" :disabled="isSubmitted">
              <ElRow :gutter="16">
                <ElCol :span="12">
                  <ElFormItem label="证件类型" required>
                    <ElSelect
                      v-if="isCompany"
                      v-model="ownerForm.sfzmmc"
                      placeholder="请选择"
                      style="width: 100%"
                    >
                      <ElOption
                        v-for="opt in companyIdTypeOptions"
                        :key="opt.value"
                        :label="opt.label"
                        :value="opt.value"
                      />
                    </ElSelect>
                    <ElSelect
                      v-else
                      v-model="ownerForm.sfzmmc"
                      placeholder="请选择"
                      style="width: 100%"
                    >
                      <ElOption
                        v-for="opt in naturalIdTypeOptions"
                        :key="opt.value"
                        :label="opt.label"
                        :value="opt.value"
                      />
                    </ElSelect>
                  </ElFormItem>
                </ElCol>
                <ElCol :span="12">
                  <ElFormItem :label="isCompany ? '企业完整名称' : '所有人姓名'" required>
                    <ElInput
                      v-model="ownerForm.syr"
                      :placeholder="isCompany ? '企业工商注册全称' : '真实姓名'"
                    />
                  </ElFormItem>
                </ElCol>
                <ElCol :span="12">
                  <ElFormItem
                    :label="isCompany ? '统一社会信用代码（18位）' : '身份证号码（18位）'"
                    required
                  >
                    <ElInput v-model="ownerForm.sfzmhm" maxlength="18" placeholder="18位证件号码" />
                  </ElFormItem>
                </ElCol>
                <ElCol :span="12">
                  <ElFormItem :label="isCompany ? '联系电话' : '联系电话（11位）'" required>
                    <ElInput v-model="ownerForm.dh" placeholder="联系电话" />
                  </ElFormItem>
                </ElCol>
                <ElCol :span="24">
                  <ElFormItem :label="isCompany ? '企业注册地址' : '联系地址'" required>
                    <ElInput v-model="ownerForm.dz" placeholder="详细地址" />
                  </ElFormItem>
                </ElCol>
              </ElRow>
            </ElForm>
          </div>
        </template>

        <!-- Step2 车辆信息 -->
        <template v-else-if="step === 2">
          <div class="ae-ocr-box">
            <div class="ae-ocr-head">
              <ArtSvgIcon icon="ri:qr-scan-2-line" />
              行驶证 / 产证上传 & OCR智能识别
              <span class="ae-ocr-tip">— 点击各照片格的 OCR识别 按钮，自动填充下方字段</span>
            </div>
            <div class="ae-ocr-grid cols-4">
              <UploadSlot
                label="行驶证正页"
                required
                enable-ocr
                ocr-hint="车牌号·车辆类型…"
                :url="vehicleImages.xszzp"
                :ocr-loading="!!ocrLoading.driving_front"
                :ocr-done="!!ocrDone.driving_front"
                :readonly="isSubmitted"
                @upload="(f) => handleVehicleUpload('xszzp', f)"
                @remove="() => handleVehicleRemove('xszzp')"
                @ocr="() => runDrivingOcr('front')"
              />
              <UploadSlot
                label="行驶证副页"
                required
                enable-ocr
                ocr-hint="车牌号·行驶证编号…"
                :url="vehicleImages.xszzpfy"
                :ocr-loading="!!ocrLoading.driving_back"
                :ocr-done="!!ocrDone.driving_back"
                :readonly="isSubmitted"
                @upload="(f) => handleVehicleUpload('xszzpfy', f)"
                @remove="() => handleVehicleRemove('xszzpfy')"
                @ocr="() => runDrivingOcr('back')"
              />
              <UploadSlot
                label="正副背面"
                required
                enable-ocr
                ocr-hint="车牌号·品牌型号"
                :url="vehicleImages.xszbmzp"
                :ocr-loading="!!ocrLoading.driving_both"
                :ocr-done="!!ocrDone.driving_both"
                :readonly="isSubmitted"
                @upload="(f) => handleVehicleUpload('xszbmzp', f)"
                @remove="() => handleVehicleRemove('xszbmzp')"
                @ocr="() => runDrivingOcr('both')"
              />
              <UploadSlot
                label="产证一二页"
                required
                enable-ocr
                ocr-hint="产证编号·行驶证编号…"
                :url="vehicleImages.czzp"
                :ocr-loading="!!ocrLoading.cert"
                :ocr-done="!!ocrDone.cert"
                :readonly="isSubmitted"
                @upload="(f) => handleVehicleUpload('czzp', f)"
                @remove="() => handleVehicleRemove('czzp')"
                @ocr="runRegCertOcr"
              />
            </div>
            <div v-if="vehicleOcrFilled" class="ae-ocr-ok">
              <ArtSvgIcon icon="ri:checkbox-circle-line" />
              OCR已识别，以下字段已自动填充，请核对后继续
            </div>
          </div>

          <div class="ae-section">
            <div class="ae-section-title">车辆信息</div>
            <ElForm label-position="top" :disabled="isSubmitted">
              <ElRow :gutter="16">
                <ElCol :span="24">
                  <ElFormItem label="车架号" required>
                    <ElInput v-model="vehicleForm.clsbdh" placeholder="请填写" />
                  </ElFormItem>
                </ElCol>
                <ElCol :span="12">
                  <ElFormItem label="号牌号码" required>
                    <ElInput v-model="vehicleForm.hphm" placeholder="如：沪BE8210" />
                  </ElFormItem>
                </ElCol>
                <ElCol :span="12">
                  <ElFormItem label="号牌种类" required>
                    <ElSelect v-model="vehicleForm.hpzl" placeholder="请选择" filterable clearable>
                      <ElOption
                        v-for="opt in hpzlDict"
                        :key="opt.value"
                        :label="opt.label"
                        :value="opt.value"
                      />
                    </ElSelect>
                  </ElFormItem>
                </ElCol>
                <ElCol :span="12">
                  <ElFormItem label="车辆类型">
                    <ElCascader
                      v-model="cllxPath"
                      :options="cllxOptions"
                      :props="{
                        value: 'value',
                        label: 'label',
                        children: 'children',
                        emitPath: false
                      }"
                      clearable
                      filterable
                      style="width: 100%"
                      @change="onCllxChange"
                    />
                  </ElFormItem>
                </ElCol>
                <ElCol :span="12">
                  <ElFormItem label="使用性质">
                    <ElSelect v-model="vehicleForm.syxz" placeholder="请选择" filterable clearable>
                      <ElOption
                        v-for="opt in syxzDict"
                        :key="opt.value"
                        :label="opt.label"
                        :value="opt.value"
                      />
                    </ElSelect>
                  </ElFormItem>
                </ElCol>
                <ElCol :span="12">
                  <ElFormItem label="行驶证编号" required>
                    <ElInput v-model="vehicleForm.xszbh" placeholder="请输入行驶证编号" />
                  </ElFormItem>
                </ElCol>
                <ElCol :span="12">
                  <ElFormItem label="产证编号" required>
                    <ElInput v-model="vehicleForm.czbh" placeholder="请输入产证编号" />
                  </ElFormItem>
                </ElCol>
                <ElCol :span="24">
                  <ElFormItem label="品牌型号" required>
                    <ElInput v-model="vehicleForm.ppxh" placeholder="如：中沃牌SWB6106MG" />
                  </ElFormItem>
                </ElCol>
                <ElCol :span="12">
                  <ElFormItem label="车辆品牌">
                    <ElInput v-model="vehicleForm.clpp1" placeholder="品牌" />
                  </ElFormItem>
                </ElCol>
                <ElCol :span="12">
                  <ElFormItem label="车辆型号">
                    <ElInput v-model="vehicleForm.clxh" placeholder="型号" />
                  </ElFormItem>
                </ElCol>
                <ElCol :span="12">
                  <ElFormItem label="注册登记日期">
                    <ElDatePicker
                      v-model="vehicleForm.ccdjrq"
                      type="date"
                      value-format="YYYY-MM-DD"
                      style="width: 100%"
                    />
                  </ElFormItem>
                </ElCol>
                <ElCol :span="12">
                  <ElFormItem label="燃油种类">
                    <ElSelect v-model="vehicleForm.rlzl" placeholder="请选择" filterable clearable>
                      <ElOption
                        v-for="opt in rlzlDict"
                        :key="opt.value"
                        :label="opt.label"
                        :value="opt.value"
                      />
                    </ElSelect>
                  </ElFormItem>
                </ElCol>
                <ElCol :span="12">
                  <ElFormItem label="发动机号码">
                    <ElInput v-model="vehicleForm.fdjh" />
                  </ElFormItem>
                </ElCol>
                <ElCol :span="12">
                  <ElFormItem label="发动机型号">
                    <ElInput v-model="vehicleForm.fdjxh" />
                  </ElFormItem>
                </ElCol>
                <ElCol :span="8">
                  <ElFormItem label="外廓长(mm)">
                    <ElInput v-model="vehicleForm.cwkc" type="number" />
                  </ElFormItem>
                </ElCol>
                <ElCol :span="8">
                  <ElFormItem label="外廓宽(mm)">
                    <ElInput v-model="vehicleForm.cwkk" type="number" />
                  </ElFormItem>
                </ElCol>
                <ElCol :span="8">
                  <ElFormItem label="外廓高(mm)">
                    <ElInput v-model="vehicleForm.cwkg" type="number" />
                  </ElFormItem>
                </ElCol>
                <ElCol :span="12">
                  <ElFormItem label="排量(ml)">
                    <ElInput v-model="vehicleForm.pl" type="number" />
                  </ElFormItem>
                </ElCol>
                <ElCol :span="12">
                  <ElFormItem label="功率(kw)">
                    <ElInput v-model="vehicleForm.gl" type="number" />
                  </ElFormItem>
                </ElCol>
                <ElCol :span="12">
                  <ElFormItem label="整备质量(kg)">
                    <ElInput v-model="vehicleForm.zbzl" type="number" />
                  </ElFormItem>
                </ElCol>
                <ElCol :span="12">
                  <ElFormItem label="总质量(kg)">
                    <ElInput v-model="vehicleForm.zzl" type="number" />
                  </ElFormItem>
                </ElCol>
                <ElCol :span="12">
                  <ElFormItem label="核定载人数">
                    <ElInput v-model="vehicleForm.hdzk" type="number" />
                  </ElFormItem>
                </ElCol>
                <ElCol :span="12">
                  <ElFormItem label="车身颜色">
                    <ElInput v-model="vehicleForm.csys" />
                  </ElFormItem>
                </ElCol>
              </ElRow>
            </ElForm>
          </div>

          <div class="ae-section">
            <div class="ae-section-title">送货方式</div>
            <div class="ae-delivery-grid">
              <button
                type="button"
                class="ae-delivery-card"
                :class="{ active: vehicleForm.delivery_method === 'tow' }"
                @click="vehicleForm.delivery_method = 'tow'"
              >
                <div class="name">需要拖车运输</div>
                <div class="desc">预约上门取车</div>
              </button>
              <button
                type="button"
                class="ae-delivery-card"
                :class="{ active: vehicleForm.delivery_method === 'self' }"
                @click="vehicleForm.delivery_method = 'self'"
              >
                <div class="name">自行送车</div>
                <div class="desc">车主自行驾驶或运输</div>
              </button>
            </div>
            <ElForm label-position="top">
              <ElRow :gutter="16">
                <ElCol :span="24">
                  <ElFormItem
                    :label="vehicleForm.delivery_method === 'tow' ? '上门取车地址' : '自送地址'"
                  >
                    <ElInput
                      v-if="vehicleForm.delivery_method === 'tow'"
                      v-model="vehicleForm.tow_pickup_address"
                    />
                    <ElInput v-else v-model="vehicleForm.self_delivery_address" />
                  </ElFormItem>
                </ElCol>
                <ElCol :span="12">
                  <ElFormItem label="联系人">
                    <ElInput
                      v-if="vehicleForm.delivery_method === 'tow'"
                      v-model="vehicleForm.tow_pickup_contact"
                    />
                    <ElInput v-else v-model="vehicleForm.self_delivery_name" />
                  </ElFormItem>
                </ElCol>
                <ElCol :span="12">
                  <ElFormItem label="联系电话">
                    <ElInput
                      v-if="vehicleForm.delivery_method === 'tow'"
                      v-model="vehicleForm.tow_pickup_phone"
                    />
                    <ElInput v-else v-model="vehicleForm.self_delivery_phone" />
                  </ElFormItem>
                </ElCol>
              </ElRow>
            </ElForm>
          </div>

          <div class="ae-section">
            <div class="ae-section-title">结算信息</div>
            <ElForm label-position="top">
              <ElRow :gutter="16">
                <ElCol :span="8">
                  <ElFormItem label="结算类型">
                    <ElSelect v-model="vehicleForm.settlement_type" clearable>
                      <ElOption label="报废" value="报废" />
                      <ElOption label="卖废铁" value="卖废铁" />
                      <ElOption label="其他" value="其他" />
                    </ElSelect>
                  </ElFormItem>
                </ElCol>
                <ElCol :span="8">
                  <ElFormItem label="结算方式">
                    <ElSelect v-model="vehicleForm.settlement_method" clearable>
                      <ElOption label="重量结算" value="重量结算" />
                      <ElOption label="整备质量结算" value="整备质量结算" />
                      <ElOption label="整车结算" value="整车结算" />
                    </ElSelect>
                  </ElFormItem>
                </ElCol>
                <ElCol :span="8">
                  <ElFormItem label="结算金额（元）">
                    <ElInput v-model="vehicleForm.settlement_amount" type="number" />
                  </ElFormItem>
                </ElCol>
                <ElCol :span="8">
                  <ElFormItem label="开户姓名/名称">
                    <ElInput v-model="vehicleForm.bank_name" />
                  </ElFormItem>
                </ElCol>
                <ElCol :span="8">
                  <ElFormItem label="开户银行">
                    <ElInput v-model="vehicleForm.bank_branch" />
                  </ElFormItem>
                </ElCol>
                <ElCol :span="8">
                  <ElFormItem label="银行卡号">
                    <ElInput v-model="vehicleForm.bank_card_no" maxlength="19" />
                  </ElFormItem>
                </ElCol>
                <ElCol :span="24">
                  <ElFormItem label="备注说明">
                    <ElInput v-model="vehicleForm.remark" type="textarea" :rows="3" />
                  </ElFormItem>
                </ElCol>
              </ElRow>
            </ElForm>
          </div>
        </template>

        <!-- Step3 代理人 -->
        <template v-else-if="step === 3">
          <div class="ae-section">
            <ElCheckbox v-model="hasAgent" :disabled="isSubmitted" @change="onAgentToggle"
              >代办场景（有代理人代为办理）</ElCheckbox
            >
          </div>
          <template v-if="hasAgent">
            <div class="ae-ocr-box">
              <div class="ae-ocr-head">
                <ArtSvgIcon icon="ri:qr-scan-2-line" />
                代理人证件上传 & OCR智能识别
                <span class="ae-ocr-tip">— 点击各照片格的 OCR识别 按钮，自动填充下方字段</span>
              </div>
              <div class="ae-ocr-grid">
                <UploadSlot
                  label="代理人身份证正面"
                  required
                  enable-ocr
                  ocr-hint="代理人姓名·身份证号码…"
                  :url="agentImages.jbrsfz1zp"
                  :ocr-loading="!!ocrLoading.agent_front"
                  :ocr-done="!!ocrDone.agent_front"
                  :readonly="isSubmitted"
                  @upload="(f) => handleAgentUpload('jbrsfz1zp', f)"
                  @remove="() => handleAgentRemove('jbrsfz1zp')"
                  @ocr="() => runAgentIdOcr('front')"
                />
                <UploadSlot
                  label="代理人身份证反面"
                  required
                  enable-ocr
                  ocr-hint="代理人身份证号码（核验）"
                  ocr-filled-text="已核验"
                  :url="agentImages.jbrsfz2zp"
                  :ocr-loading="!!ocrLoading.agent_back"
                  :ocr-done="!!ocrDone.agent_back"
                  :readonly="isSubmitted"
                  @upload="(f) => handleAgentUpload('jbrsfz2zp', f)"
                  @remove="() => handleAgentRemove('jbrsfz2zp')"
                  @ocr="() => runAgentIdOcr('back')"
                />
                <UploadSlot
                  label="委托说明"
                  required
                  :url="agentImages.jbrzp"
                  :readonly="isSubmitted"
                  @upload="(f) => handleAgentUpload('jbrzp', f)"
                  @remove="() => handleAgentRemove('jbrzp')"
                />
              </div>
              <div v-if="agentOcrFilled" class="ae-ocr-ok">
                <ArtSvgIcon icon="ri:checkbox-circle-line" />
                OCR已识别，以下字段已自动填充，请核对后继续
              </div>
            </div>
            <div class="ae-section">
              <div class="ae-section-title">代理人信息</div>
              <ElForm label-position="top">
                <ElRow :gutter="16">
                  <ElCol :span="12">
                    <ElFormItem label="代理人姓名" required>
                      <ElInput v-model="agentForm.jbr" />
                    </ElFormItem>
                  </ElCol>
                  <ElCol :span="12">
                    <ElFormItem label="代理人证件号码（18位）" required>
                      <ElInput v-model="agentForm.jbrsfzmhm" maxlength="18" />
                    </ElFormItem>
                  </ElCol>
                  <ElCol :span="12">
                    <ElFormItem label="代理人联系电话（11位）" required>
                      <ElInput v-model="agentForm.jbrdh" />
                    </ElFormItem>
                  </ElCol>
                </ElRow>
              </ElForm>
            </div>
          </template>
          <ElEmpty v-else description="未勾选代办，可直接进入下一步" :image-size="80" />
        </template>

        <!-- Step4 实名认证 -->
        <template v-else-if="step === 4">
          <div class="ae-section-title">所有人代人代理实名认证（请完成一项实名认证）</div>
          <div class="ae-ocr-box">
            <div class="ae-auth-row">
              <span style="width: 72px; font-size: 12px; color: #9ca3af">所有人认证</span>
              <span style="flex: 1; font-weight: 500">{{
                ownerForm.syr || (isPersonal ? '（请填写所有人姓名）' : '（请填写企业名称）')
              }}</span>
              <ElTag :type="ownerAuthed ? 'success' : 'warning'" size="small">
                {{ ownerAuthed ? '已认证' : '待认证' }}
              </ElTag>
              <ElButton
                size="small"
                type="primary"
                :disabled="isSubmitted"
                @click="openAuth('syr')"
              >
                去认证
              </ElButton>
            </div>
            <div class="ae-auth-meta">
              <span>证件号：{{ ownerForm.sfzmhm || '—' }}</span>
              <span>联系电话：{{ ownerForm.dh || '—' }}</span>
            </div>
            <div class="ae-auth-row">
              <span style="width: 72px; font-size: 12px; color: #9ca3af">代理人认证</span>
              <span style="flex: 1; font-weight: 500">{{
                agentForm.jbr || '（请填写代理人姓名）'
              }}</span>
              <ElTag :type="agentAuthed ? 'success' : 'warning'" size="small">
                {{ agentAuthed ? '已认证' : '待认证' }}
              </ElTag>
              <ElButton
                size="small"
                type="primary"
                :disabled="isSubmitted"
                @click="openAuth('dlr')"
              >
                去认证
              </ElButton>
            </div>
            <div class="ae-auth-meta">
              <span>证件号：{{ agentForm.jbrsfzmhm || '—' }}</span>
              <span>联系电话：{{ agentForm.jbrdh || '—' }}</span>
            </div>
          </div>
        </template>

        <!-- Step5 影像材料 -->
        <template v-else-if="step === 5">
          <div class="ae-readonly-box">
            <div class="ae-readonly-head">
              <span>
                报废机动车回收证明
                <span class="ae-readonly-badge">商务部同步 · 只读</span>
              </span>
              <div>
                <!-- <ElButton size="small" @click="handleCertificateAction('view')">查看</ElButton> -->
                <ElButton size="small" type="primary" @click="handleCertificateAction">
                  下载
                </ElButton>
              </div>
            </div>
            <div class="ae-cert-preview">
              <div v-if="scrapFilesLoading" class="ae-cert-empty">加载回收证明数据...</div>
              <div v-else-if="scrapDjid" class="ae-cert-empty">
                登记单号：{{ scrapDjid }}，可点击右上角查看/下载完整回收证明
              </div>
              <div v-else class="ae-cert-empty">暂无回收证明数据</div>
            </div>
          </div>

          <div class="ae-material-tip" :class="{ warn: isSubmitted }">
            <ArtSvgIcon :icon="isSubmitted ? 'ri:error-warning-line' : 'ri:information-line'" />
            {{
              isSubmitted
                ? '已提交至商务部，材料不可修改，但可点击查看大图。'
                : '所有材料支持单/多图上传、预览、删除；核心材料均支持上传"缺失情况说明图片"作为替代凭证。'
            }}
          </div>

          <div class="ae-section-title">所有人证件材料</div>
          <div class="ae-ocr-grid" :class="isCompany ? '' : 'cols-3'">
            <template v-if="isCompany">
              <UploadSlot
                label="营业执照原件"
                required
                :url="ownerImages.syrzp"
                :readonly="isSubmitted"
                @upload="(f) => handleOwnerUpload('syrzp', f)"
                @remove="() => handleOwnerRemove('syrzp')"
              />
              <UploadSlot
                label="缺失情况说明"
                :url="ownerImages.qksmzp"
                :readonly="isSubmitted"
                @upload="(f) => handleOwnerUpload('qksmzp', f)"
                @remove="() => handleOwnerRemove('qksmzp')"
              />
            </template>
            <template v-else>
              <UploadSlot
                label="身份证正面"
                required
                :url="ownerImages.sfz1zp || ownerImages.syrzp"
                :readonly="isSubmitted"
                @upload="(f) => handleOwnerUpload('sfz1zp', f)"
                @remove="() => handleOwnerRemove('sfz1zp')"
              />
              <UploadSlot
                label="身份证反面"
                required
                :url="ownerImages.sfz2zp"
                :readonly="isSubmitted"
                @upload="(f) => handleOwnerUpload('sfz2zp', f)"
                @remove="() => handleOwnerRemove('sfz2zp')"
              />
              <UploadSlot
                label="缺失情况说明"
                :url="ownerImages.qksmzp"
                :readonly="isSubmitted"
                @upload="(f) => handleOwnerUpload('qksmzp', f)"
                @remove="() => handleOwnerRemove('qksmzp')"
              />
            </template>
          </div>

          <div class="ae-section-title">车辆证件材料</div>
          <div class="ae-ocr-grid cols-4">
            <UploadSlot
              label="行驶证正页"
              required
              :url="vehicleImages.xszzp"
              :readonly="isSubmitted"
              @upload="(f) => handleVehicleUpload('xszzp', f)"
              @remove="() => handleVehicleRemove('xszzp')"
            />
            <UploadSlot
              label="行驶证副页"
              required
              :url="vehicleImages.xszzpfy"
              :readonly="isSubmitted"
              @upload="(f) => handleVehicleUpload('xszzpfy', f)"
              @remove="() => handleVehicleRemove('xszzpfy')"
            />
            <UploadSlot
              label="正副背面"
              required
              :url="vehicleImages.xszbmzp"
              :readonly="isSubmitted"
              @upload="(f) => handleVehicleUpload('xszbmzp', f)"
              @remove="() => handleVehicleRemove('xszbmzp')"
            />
            <UploadSlot
              label="产证一二页"
              required
              :url="vehicleImages.czzp"
              :readonly="isSubmitted"
              @upload="(f) => handleVehicleUpload('czzp', f)"
              @remove="() => handleVehicleRemove('czzp')"
            />
          </div>
          <div class="ae-ocr-grid cols-4" style="margin-top: 12px">
            <UploadSlot
              label="产权变更页（如有）"
              :url="ownerImages.blpzzp"
              :readonly="isSubmitted"
              @upload="(f) => handleOwnerUpload('blpzzp', f)"
              @remove="() => handleOwnerRemove('blpzzp')"
            />
          </div>

          <div class="ae-section-title">拖车进场照片</div>
          <div v-if="isSubmitted" class="ae-ocr-grid cols-4">
            <div v-for="item in towReadonlyItems" :key="item.field" class="ae-readonly-photo">
              <div class="ae-readonly-photo-label">{{ item.label }}</div>
              <div class="ae-readonly-slot">
                <ElImage
                  v-if="getScrapFileUrl(item.field)"
                  :src="getScrapFileUrl(item.field)"
                  fit="cover"
                  class="ae-readonly-img"
                  :preview-src-list="[getScrapFileUrl(item.field)]"
                  preview-teleported
                />
                <template v-else>
                  <ArtSvgIcon icon="ri:camera-line" style="margin-bottom: 4px; font-size: 20px" />
                  暂无图片
                </template>
              </div>
            </div>
          </div>
          <div v-else class="ae-ocr-grid cols-4">
            <UploadSlot
              label="拖车单"
              required
              :url="materialImages.photo_front"
              @upload="(f) => handleMaterialUpload('photo_front', f)"
              @remove="() => handleMaterialRemove('photo_front')"
            />
            <UploadSlot
              label="整车照"
              required
              :url="materialImages.photo_side"
              @upload="(f) => handleMaterialUpload('photo_side', f)"
              @remove="() => handleMaterialRemove('photo_side')"
            />
            <UploadSlot
              label="车架拓印照"
              :url="materialImages.photo_back"
              @upload="(f) => handleMaterialUpload('photo_back', f)"
              @remove="() => handleMaterialRemove('photo_back')"
            />
            <UploadSlot
              label="车架号照"
              :url="materialImages.photo_interior"
              @upload="(f) => handleMaterialUpload('photo_interior', f)"
              @remove="() => handleMaterialRemove('photo_interior')"
            />
          </div>

          <div class="ae-section-title">代理人证件材料</div>
          <div class="ae-ocr-grid">
            <UploadSlot
              label="代理人身份证正面"
              required
              :url="agentImages.jbrsfz1zp"
              :readonly="isSubmitted"
              @upload="(f) => handleAgentUpload('jbrsfz1zp', f)"
              @remove="() => handleAgentRemove('jbrsfz1zp')"
            />
            <UploadSlot
              label="代理人身份证反面"
              required
              :url="agentImages.jbrsfz2zp"
              :readonly="isSubmitted"
              @upload="(f) => handleAgentUpload('jbrsfz2zp', f)"
              @remove="() => handleAgentRemove('jbrsfz2zp')"
            />
            <UploadSlot
              label="委托说明"
              required
              :url="agentImages.jbrzp"
              :readonly="isSubmitted"
              @upload="(f) => handleAgentUpload('jbrzp', f)"
              @remove="() => handleAgentRemove('jbrzp')"
            />
          </div>

          <div class="ae-material-tip warn">
            <ArtSvgIcon icon="ri:error-warning-line" />
            以下照片是从商务部系统同步的，数据不可在本系统修改。
          </div>

          <div class="ae-readonly-box">
            <div class="ae-readonly-head">
              <span>
                报废车拆解照片
                <span class="ae-readonly-badge">本地缓存 · 只读</span>
              </span>
            </div>
            <div class="ae-readonly-grid">
              <div v-for="item in dismantlePhotoItems" :key="item.field" class="ae-readonly-photo">
                <div class="ae-readonly-photo-label">{{ item.label }}</div>
                <div class="ae-readonly-slot">
                  <ElImage
                    v-if="getScrapFileUrl(item.field)"
                    :src="getScrapFileUrl(item.field)"
                    fit="cover"
                    class="ae-readonly-img"
                    :preview-src-list="[getScrapFileUrl(item.field)]"
                    preview-teleported
                  />
                  <template v-else>
                    <ArtSvgIcon icon="ri:camera-line" style="margin-bottom: 4px; font-size: 20px" />
                    暂无图片
                  </template>
                </div>
              </div>
            </div>
          </div>

          <div class="ae-readonly-box">
            <div class="ae-readonly-head">
              <span>
                办证注销
                <span class="ae-readonly-badge">商务部同步 · 只读</span>
              </span>
            </div>
            <div class="ae-readonly-grid">
              <div class="ae-readonly-photo">
                <div class="ae-readonly-photo-label">回收证明</div>
                <div class="ae-readonly-slot">
                  <ArtSvgIcon icon="ri:camera-line" style="margin-bottom: 4px; font-size: 20px" />
                  {{ scrapDjid ? '已领取' : '未领取' }}
                </div>
              </div>
              <div v-for="item in cancelPhotoItems" :key="item.field" class="ae-readonly-photo">
                <div class="ae-readonly-photo-label">{{ item.label }}</div>
                <div class="ae-readonly-slot">
                  <ElImage
                    v-if="getScrapFileUrl(item.field)"
                    :src="getScrapFileUrl(item.field)"
                    fit="cover"
                    class="ae-readonly-img"
                    :preview-src-list="[getScrapFileUrl(item.field)]"
                    preview-teleported
                  />
                  <template v-else>
                    <ArtSvgIcon icon="ri:camera-line" style="margin-bottom: 4px; font-size: 20px" />
                    暂无图片
                  </template>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>

    <template #footer>
      <template v-if="phase === 'scene'">
        <ElButton @click="dialogVisible = false">取消</ElButton>
        <ElButton type="primary" :loading="initLoading" @click="confirmScene">确定</ElButton>
      </template>
      <div
        v-else-if="isSubmitted"
        style="display: flex; justify-content: space-between; width: 100%"
      >
        <span style="font-size: 13px; color: #52c41a">已提交至商务部</span>
        <div style="display: flex; gap: 12px">
          <ElButton @click="dialogVisible = false">关闭</ElButton>
          <ElButton type="primary" plain @click="viewSubmitResult">查看提交结果</ElButton>
        </div>
      </div>
      <div v-else style="display: flex; justify-content: space-between; width: 100%">
        <div class="ae-footer-left">
          <span>步骤 {{ step }} / 5</span>
          <span v-if="draftSaved" style="color: #52c41a">已暂存</span>
        </div>
        <div style="display: flex; gap: 12px">
          <ElButton @click="dialogVisible = false">关闭</ElButton>
          <ElButton v-if="step > 1" @click="goPrev">上一步</ElButton>
          <ElButton :loading="saving" @click="handleSaveDraft">暂存本步</ElButton>
          <ElButton v-if="step < 5" type="primary" :loading="saving" @click="goNext"
            >下一步</ElButton
          >
          <ElButton
            v-else
            type="primary"
            :loading="submitting"
            :disabled="!authCompleted"
            @click="handleSubmit"
          >
            {{ authCompleted ? '提交至商务部' : '请先完成实名认证' }}
          </ElButton>
        </div>
      </div>
    </template>
  </ElDialog>

  <!-- 提交成功 -->
  <ElDialog
    v-model="submitResultVisible"
    title="提交成功"
    width="640px"
    align-center
    append-to-body
  >
    <ElAlert
      type="success"
      :closable="false"
      show-icon
      :title="`${submitResult?.vin || '—'} · ${submitResult?.plate_no || '—'} 档案已成功提交至商务部`"
    />
    <ElDescriptions :column="2" border style="margin-top: 16px">
      <ElDescriptionsItem label="车架号">{{ submitResult?.vin || '—' }}</ElDescriptionsItem>
      <ElDescriptionsItem label="车牌号">{{ submitResult?.plate_no || '—' }}</ElDescriptionsItem>
      <ElDescriptionsItem label="所有人">{{ submitResult?.owner_name || '—' }}</ElDescriptionsItem>
      <ElDescriptionsItem label="联系电话">{{
        submitResult?.owner_phone || '—'
      }}</ElDescriptionsItem>
      <ElDescriptionsItem label="提交时间">{{
        submitResult?.submit_time || '—'
      }}</ElDescriptionsItem>
      <ElDescriptionsItem label="流水号">{{ submitResult?.djid || '—' }}</ElDescriptionsItem>
    </ElDescriptions>
    <template #footer>
      <ElButton @click="submitResultVisible = false">关闭</ElButton>
      <ElButton type="primary" @click="handleFetchArchive">抓取车辆档案信息</ElButton>
    </template>
  </ElDialog>

  <!-- 认证弹窗（对齐 admin） -->
  <ElDialog
    v-model="authVisible"
    title="实名认证"
    width="720px"
    align-center
    append-to-body
    @closed="handleAuthDialogClosed"
  >
    <div style="margin-bottom: 16px; font-size: 14px">
      认证人：
      <b>{{ authType === 'syr' ? ownerForm.syr || '—' : agentForm.jbr || '—' }}</b>
    </div>
    <ElRow :gutter="40">
      <ElCol :span="12">
        <ElCheckbox v-model="authSmsChecked" @change="onAuthSmsModeChange">短信认证</ElCheckbox>
        <ElInput
          v-model="authPhone"
          placeholder="请输入手机号"
          maxlength="11"
          clearable
          style="margin-top: 12px"
        />
        <div v-if="authPhone && !authSending && authSmsCountdown <= 0" class="ae-auth-hint">
          即将发送认证短信到【{{ authPhone }}】。
        </div>
        <div v-if="authSmsCountdown > 0" class="ae-auth-hint">
          验证码已发送，{{ authSmsCountdown }}秒后可重新发送。
        </div>
        <div v-if="authSending" class="ae-auth-hint">短信发送中...</div>
      </ElCol>
      <ElCol :span="12">
        <ElCheckbox v-model="authQrChecked" @change="onAuthQrModeChange">扫码认证</ElCheckbox>
        <ol class="ae-auth-qr-steps">
          <li>将跳转至认证页面进行扫码认证，请打开支付宝 APP（推荐）或微信扫码功能。</li>
          <li>扫码认证完成后关闭本窗口即可。</li>
        </ol>
        <ElButton
          v-if="authQrChecked"
          type="primary"
          size="small"
          :loading="authQrLoading"
          style="width: 100%; margin-top: 16px"
          @click="handleAuthQrScan"
        >
          去认证
        </ElButton>
      </ElCol>
    </ElRow>
    <ElAlert
      type="error"
      :closable="false"
      show-icon
      title="短信实名认证期间请勿更改姓名和身份证，以免实名认证无法通过！"
      style="margin-top: 12px"
    />
    <template #footer>
      <ElButton @click="authVisible = false">取消</ElButton>
      <ElButton
        v-if="authSmsChecked"
        type="primary"
        :loading="authSending"
        :disabled="authSmsCountdown > 0"
        @click="handleAuthSendSms"
      >
        {{ authSmsCountdown > 0 ? `短信已发送(${authSmsCountdown})` : '发送认证短信' }}
      </ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import {
    fetchAcceptArchive,
    fetchAcceptAuthSms,
    fetchAcceptFilesCache,
    fetchAcceptInitForm,
    fetchAcceptOriginFields,
    fetchAcceptRecognizeDrivingLicense,
    fetchAcceptRecognizeIdCard,
    fetchAcceptRecognizeLicense,
    fetchAcceptRecognizeRegCert,
    fetchAcceptSaveAgent,
    fetchAcceptSaveOwner,
    fetchAcceptSaveVehicle,
    fetchAcceptSubmit,
    fetchAcceptSubmitResult,
    fetchAcceptSyncFiles,
    fetchAcceptUploadImage
  } from '@/api/recycle/accept'
  import type { AcceptSubmitResult } from '@/types/recycle/accept'
  import { fetchCllxCascade, fetchDataDictList } from '@/api/recycle/data-dict'
  import { fetchVehicleDetail } from '@/api/recycle/vehicle'
  import ArtSvgIcon from '@/components/core/base/art-svg-icon/index.vue'
  import type { AcceptHplx, AcceptSyq } from '@/types/recycle/accept'
  import type { CllxCascadeNode } from '@/types/recycle/data-dict'
  import { ElMessage } from 'element-plus'
  import UploadSlot from './vehicle-archive-upload-slot.vue'
  import {
    applyDrivingOcrResult,
    applyIdCardFrontResult,
    applyLicenseOcrResult,
    applyRegCertOcrResult
  } from './vehicle-archive-ocr'
  import './vehicle-archive-edit-dialog.scss'

  defineOptions({ name: 'VehicleArchiveEditDialog' })

  const props = defineProps<{
    visible: boolean
    vehicleId: number
    /** 列表行数据，对齐 admin archiveEdit.open(id, row) */
    vehicleRow?: import('@/types/recycle/vehicle').ScrapVehicle | null
  }>()

  const emit = defineEmits<{
    'update:visible': [boolean]
    success: []
  }>()

  const dialogVisible = computed({
    get: () => props.visible,
    set: (v) => emit('update:visible', v)
  })

  const phase = ref<'scene' | 'form'>('scene')
  const initLoading = ref(false)
  const loading = ref(false)
  const saving = ref(false)
  const submitting = ref(false)
  const draftSaved = ref(false)
  const isSubmitted = ref(false)
  /** 打开前是否已有 owner_sync_id（有则 init 后回显 sync） */
  const existingOwnerSyncId = ref(0)

  const hplx = ref<AcceptHplx>(1)
  /** 对齐 admin：1=单位/企业 2=个人，默认个人 */
  const syq = ref<AcceptSyq>(2)
  const cjid = ref('')
  const step = ref(1)
  const acceptTime = ref('')
  const submitResult = ref<AcceptSubmitResult | null>(null)
  const submitResultVisible = ref(false)

  const hplxOptions = [
    { value: 1 as AcceptHplx, label: '沪牌机动车', desc: '上海本地登记，需完整车辆信息' },
    { value: 2 as AcceptHplx, label: '外牌机动车', desc: '非沪登记车辆' },
    { value: 3 as AcceptHplx, label: '非车管（场内）', desc: '场内非机动车管理车辆' }
  ]
  const syqOptions = [
    { value: 2 as AcceptSyq, label: '个人车辆', desc: '自然人登记，需身份证实名认证' },
    { value: 1 as AcceptSyq, label: '企业/单位/机构车辆', desc: '法人单位登记，需营业执照认证' }
  ]

  const hplxLabel = computed(
    () => hplxOptions.find((i) => i.value === hplx.value)?.label || '沪牌机动车'
  )
  const syqLabel = computed(
    () => syqOptions.find((i) => i.value === syq.value)?.label || '个人车辆'
  )
  const isCompany = computed(() => syq.value === 1)
  const isPersonal = computed(() => syq.value === 2)

  const visibleSteps = [
    { id: 1, label: '所有人信息' },
    { id: 2, label: '车辆信息' },
    { id: 3, label: '代理人信息' },
    { id: 4, label: '实名认证' },
    { id: 5, label: '影像材料' }
  ]

  const linkInfo = reactive({
    order_no: '',
    archive_no: '',
    tow_order_no: '',
    lead_no: ''
  })

  const ownerForm = reactive({
    syr: '',
    sfzmhm: '',
    dh: '',
    dz: '',
    sfzmmc: '',
    hpzl: '',
    syrsmrz: '',
    sfyd: '',
    zcbj: '',
    syq: ''
  })
  const ownerImages = reactive<Record<string, string>>({
    syrzp: '',
    sfz1zp: '',
    sfz2zp: '',
    qksmzp: '',
    blpzzp: ''
  })

  const vehicleForm = reactive({
    clsbdh: '',
    hphm: '',
    hpzl: '',
    cllx: '',
    syxz: '',
    ccdjrq: '',
    rlzl: '',
    fdjh: '',
    fdjxh: '',
    xszbh: '',
    czbh: '',
    clpp1: '',
    clxh: '',
    ppxh: '',
    cwkc: '',
    cwkk: '',
    cwkg: '',
    gl: '',
    pl: '',
    hdzk: '',
    zbzl: '',
    zzl: '',
    csys: '',
    delivery_method: 'self',
    tow_pickup_address: '',
    tow_pickup_contact: '',
    tow_pickup_phone: '',
    self_delivery_address: '',
    self_delivery_name: '',
    self_delivery_phone: '',
    settlement_type: 'personal',
    settlement_method: '',
    settlement_amount: '',
    bank_name: '',
    bank_branch: '',
    bank_card_no: '',
    remark: ''
  })
  const vehicleImages = reactive<Record<string, string>>({
    xszzp: '',
    xszzpfy: '',
    xszbmzp: '',
    czzp: ''
  })
  const materialImages = reactive({
    photo_front: '',
    photo_side: '',
    photo_back: '',
    photo_interior: ''
  })

  const scrapDjid = ref('')
  const scrapFilesLoading = ref(false)
  const cllxPath = ref('')
  const cllxOptions = ref<CllxCascadeNode[]>([])
  const scrapCacheFiles = ref<Record<string, { url?: string }>>({})

  const companyIdTypeOptions = [
    { label: '统一社会信用代码', value: 'N' },
    { label: '组织机构代码证书', value: 'B' },
    { label: '单位注销证明', value: 'J' },
    { label: '驻华机构证明', value: 'L' },
    { label: '个体工商户营业执照注册号', value: 'P' }
  ]

  const hasAgent = ref(true)
  const agentForm = reactive({
    jbr: '',
    jbrsfzmhm: '',
    jbrdh: '',
    jbrsmrz: ''
  })
  const agentImages = reactive<Record<string, string>>({
    jbrsfz1zp: '',
    jbrsfz2zp: '',
    jbrzp: ''
  })

  /** 对齐 admin：认证状态来自 sync 的 syrsmrz / jbrsmrz */
  const ownerAuthed = computed(() => ownerForm.syrsmrz === '1')
  const agentAuthed = computed(() => agentForm.jbrsmrz === '1')
  const authCompleted = computed(() => {
    if (!ownerAuthed.value) return false
    if (hasAgent.value && !agentAuthed.value) return false
    return true
  })

  const authVisible = ref(false)
  const authType = ref<'syr' | 'dlr'>('syr')
  const authPhone = ref('')
  const authSending = ref(false)
  const authSmsChecked = ref(true)
  const authQrChecked = ref(false)
  const authSmsCountdown = ref(0)
  const authQrLoading = ref(false)
  let authSmsTimer: ReturnType<typeof setInterval> | null = null

  const ocrLoading = reactive<Record<string, boolean>>({})
  const ocrDone = reactive<Record<string, boolean>>({})

  const ownerOcrFilled = computed(() => !!(ocrDone.license || ocrDone.id_front || ocrDone.id_back))
  const vehicleOcrFilled = computed(
    () => !!(ocrDone.driving_front || ocrDone.driving_back || ocrDone.driving_both || ocrDone.cert)
  )
  const agentOcrFilled = computed(() => !!(ocrDone.agent_front || ocrDone.agent_back))

  type DictOpt = { label: string; value: string }
  const hpzlDict = ref<DictOpt[]>([])
  const syxzDict = ref<DictOpt[]>([])
  const rlzlDict = ref<DictOpt[]>([])

  const FALLBACK_HPZL = [
    '大型汽车',
    '小型汽车',
    '使馆汽车',
    '领馆汽车',
    '境外汽车',
    '外籍汽车',
    '教练汽车',
    '营运汽车',
    '摩托车',
    '轻便摩托车',
    '挂车',
    '农用运输车'
  ].map((t, i) => ({ label: t, value: String(i + 1) }))
  const FALLBACK_SYXZ = ['非营运', '营运', '出租', '教练', '警用', '消防', '救护', '工程作业'].map(
    (t) => ({ label: t, value: t })
  )
  const FALLBACK_RLZL = ['汽油', '柴油', '纯电动', '混合动力', '天然气', '液化气', '其他'].map(
    (t) => ({ label: t, value: t })
  )

  const dismantlePhotoItems = [
    { label: '车架照', field: 'cjzp' },
    { label: '发动机照', field: 'fdjzp' },
    { label: '变速箱照', field: 'bsqzp' },
    { label: '方向器照', field: 'fxjzp' },
    { label: '前桥照', field: 'qqzp' },
    { label: '后桥照', field: 'hqzp' },
    { label: '钢印部照片', field: 'gybwzp' }
  ]
  const cancelPhotoItems = [
    { label: '销毁号牌照', field: 'xhhpzp' },
    { label: '注销证明', field: 'zxzmzp' },
    { label: '领取人', field: 'lqrsfz1zp' }
  ]
  const towReadonlyItems = [
    { label: '拖车单', field: 'tcjczp' },
    { label: '整车照', field: 'zczp' },
    { label: '车架拓印照', field: 'gyzp' },
    { label: '车架号照', field: 'cjhzp' },
    { label: '发动机照', field: 'fdjhzp' }
  ]

  const naturalIdTypeOptions = ref<DictOpt[]>([{ label: '居民身份证', value: 'A' }])

  const stepComplete = computed(() => [1, 2, 3, 4, 5].map((n) => isStepComplete(n)))

  function str(v: unknown) {
    return v === null || v === undefined ? '' : String(v)
  }

  function formatDate(raw: unknown) {
    if (!raw) return ''
    const s = String(raw)
    if (s.length === 8 && /^\d{8}$/.test(s)) {
      return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`
    }
    return s
  }

  function hasVal(v: unknown) {
    return v !== '' && v !== null && v !== undefined
  }

  function nonZero(v: unknown) {
    return hasVal(v) && v !== 0 && v !== '0'
  }

  /** 对齐 admin isStepComplete */
  function isStepComplete(stepNo: number) {
    if (stepNo === 1) {
      if (!hasVal(ownerForm.sfzmmc) || !hasVal(ownerForm.syr) || !hasVal(ownerForm.sfzmhm))
        return false
      if (!hasVal(ownerForm.dh) || !hasVal(ownerForm.dz)) return false
      if (isPersonal.value) {
        return hasVal(ownerImages.sfz1zp || ownerImages.syrzp) && hasVal(ownerImages.sfz2zp)
      }
      return hasVal(ownerImages.syrzp)
    }
    if (stepNo === 2) {
      if (
        !hasVal(vehicleImages.xszzp) ||
        !hasVal(vehicleImages.xszzpfy) ||
        !hasVal(vehicleImages.xszbmzp) ||
        !hasVal(vehicleImages.czzp)
      )
        return false
      if (!hasVal(vehicleForm.clsbdh) || !hasVal(vehicleForm.hphm) || !hasVal(vehicleForm.hpzl))
        return false
      if (!hasVal(vehicleForm.cllx) || !hasVal(vehicleForm.syxz) || !hasVal(vehicleForm.xszbh))
        return false
      if (!hasVal(vehicleForm.czbh) || !hasVal(vehicleForm.ppxh)) return false
      if (!hasVal(vehicleForm.ccdjrq) || !hasVal(vehicleForm.rlzl) || !hasVal(vehicleForm.fdjh))
        return false
      if (!hasVal(vehicleForm.csys)) return false
      if (!nonZero(vehicleForm.cwkc) || !nonZero(vehicleForm.cwkk) || !nonZero(vehicleForm.cwkg))
        return false
      if (!nonZero(vehicleForm.pl) || !nonZero(vehicleForm.gl)) return false
      if (!nonZero(vehicleForm.zbzl) || !nonZero(vehicleForm.zzl) || !nonZero(vehicleForm.hdzk))
        return false
      if (!hasVal(vehicleForm.delivery_method) || !hasVal(vehicleForm.settlement_type)) return false
      if (!hasVal(vehicleForm.settlement_method)) return false
      if (vehicleForm.delivery_method === 'tow') {
        if (
          !hasVal(vehicleForm.tow_pickup_address) ||
          !hasVal(vehicleForm.tow_pickup_contact) ||
          !hasVal(vehicleForm.tow_pickup_phone)
        )
          return false
      } else if (vehicleForm.delivery_method === 'self') {
        if (
          !hasVal(vehicleForm.self_delivery_address) ||
          !hasVal(vehicleForm.self_delivery_name) ||
          !hasVal(vehicleForm.self_delivery_phone)
        )
          return false
      }
      if (
        !hasVal(vehicleForm.bank_name) ||
        !hasVal(vehicleForm.bank_branch) ||
        !hasVal(vehicleForm.bank_card_no)
      )
        return false
      return true
    }
    if (stepNo === 3) {
      if (!hasAgent.value) return true
      return (
        hasVal(agentImages.jbrsfz1zp) &&
        hasVal(agentImages.jbrsfz2zp) &&
        hasVal(agentImages.jbrzp) &&
        hasVal(agentForm.jbr) &&
        hasVal(agentForm.jbrsfzmhm) &&
        hasVal(agentForm.jbrdh)
      )
    }
    if (stepNo === 4) {
      if (!ownerAuthed.value) return false
      if (hasAgent.value && !agentAuthed.value) return false
      return true
    }
    if (stepNo === 5) {
      if (!hasVal(materialImages.photo_front) || !hasVal(materialImages.photo_side)) return false
      if (isPersonal.value) {
        if (!hasVal(ownerImages.sfz1zp || ownerImages.syrzp) || !hasVal(ownerImages.sfz2zp))
          return false
      } else if (!hasVal(ownerImages.syrzp)) {
        return false
      }
      if (
        !hasVal(vehicleImages.xszzp) ||
        !hasVal(vehicleImages.xszzpfy) ||
        !hasVal(vehicleImages.xszbmzp) ||
        !hasVal(vehicleImages.czzp)
      )
        return false
      if (hasAgent.value) {
        if (
          !hasVal(agentImages.jbrsfz1zp) ||
          !hasVal(agentImages.jbrsfz2zp) ||
          !hasVal(agentImages.jbrzp)
        )
          return false
      }
      return true
    }
    return false
  }

  function getScrapFileUrl(field: string) {
    const fileData = scrapCacheFiles.value[field]
    if (!fileData) return ''
    if (typeof fileData === 'string') return fileData
    return fileData.url || ''
  }

  async function loadDict(type: string, fallback: DictOpt[]) {
    try {
      const res = await fetchDataDictList({ dict_type: type, status: 1, page: 1, limit: 200 })
      const list = (res.list || []).map((i) => ({
        label: i.dict_label || String(i.dict_value ?? ''),
        value: String(i.dict_value ?? '')
      }))
      return list.length ? list : fallback
    } catch {
      return fallback
    }
  }

  async function loadOptions() {
    const [hpzl, syxz, rlzl, naturalId, cascade] = await Promise.all([
      loadDict('hpzl', FALLBACK_HPZL),
      loadDict('syxz', FALLBACK_SYXZ),
      loadDict('rlzl', FALLBACK_RLZL),
      loadDict('id_type_natural', [{ label: '居民身份证', value: 'A' }]),
      fetchCllxCascade().catch(() => [] as CllxCascadeNode[])
    ])
    hpzlDict.value = hpzl
    syxzDict.value = syxz
    rlzlDict.value = rlzl
    naturalIdTypeOptions.value = naturalId
    cllxOptions.value = cascade || []
  }

  function onCllxChange(val: unknown) {
    vehicleForm.cllx = val == null || Array.isArray(val) ? '' : String(val)
  }

  function imgUrl(v: unknown) {
    if (!v) return ''
    if (typeof v === 'string') return v
    const o = v as Record<string, string>
    return o.url || o.src || o.att_dir || ''
  }

  function resetState() {
    phase.value = 'scene'
    hplx.value = 1
    syq.value = 2
    cjid.value = ''
    step.value = 1
    draftSaved.value = false
    isSubmitted.value = false
    existingOwnerSyncId.value = 0
    submitResult.value = null
    submitResultVisible.value = false
    scrapCacheFiles.value = {}
    Object.assign(ownerForm, {
      syr: '',
      sfzmhm: '',
      dh: '',
      dz: '',
      sfzmmc: 'A',
      hpzl: '',
      syrsmrz: '',
      sfyd: '',
      zcbj: '',
      syq: '2'
    })
    Object.keys(ownerImages).forEach((k) => (ownerImages[k] = ''))
    Object.assign(vehicleForm, {
      clsbdh: '',
      hphm: '',
      hpzl: '',
      cllx: '',
      syxz: '',
      ccdjrq: '',
      rlzl: '',
      fdjh: '',
      fdjxh: '',
      xszbh: '',
      czbh: '',
      clpp1: '',
      clxh: '',
      ppxh: '',
      cwkc: '',
      cwkk: '',
      cwkg: '',
      gl: '',
      pl: '',
      hdzk: '',
      zbzl: '',
      zzl: '',
      csys: '',
      delivery_method: 'self',
      tow_pickup_address: '',
      tow_pickup_contact: '',
      tow_pickup_phone: '',
      self_delivery_address: '',
      self_delivery_name: '',
      self_delivery_phone: '',
      settlement_type: 'personal',
      settlement_method: '',
      settlement_amount: '',
      bank_name: '',
      bank_branch: '',
      bank_card_no: '',
      remark: ''
    })
    Object.keys(vehicleImages).forEach((k) => (vehicleImages[k] = ''))
    Object.assign(agentForm, { jbr: '', jbrsfzmhm: '', jbrdh: '', jbrsmrz: '' })
    Object.keys(agentImages).forEach((k) => (agentImages[k] = ''))
    hasAgent.value = true
    cllxPath.value = ''
    Object.keys(ocrLoading).forEach((k) => delete ocrLoading[k])
    Object.keys(ocrDone).forEach((k) => delete ocrDone[k])
    Object.assign(linkInfo, { order_no: '', archive_no: '', tow_order_no: '', lead_no: '' })
    Object.keys(materialImages).forEach((k) => ((materialImages as Record<string, string>)[k] = ''))
    scrapDjid.value = ''
    scrapCacheFiles.value = {}
  }

  /** 车辆详情回填（对齐 admin loadVehicleData） */
  async function loadVehicleData() {
    if (!props.vehicleId) return
    const detail = await fetchVehicleDetail(props.vehicleId)
    linkInfo.order_no = str(detail.order_no)
    linkInfo.archive_no = str(detail.vehicle_no || detail.archive_no)
    linkInfo.tow_order_no = str((detail as Record<string, unknown>).tow_order_no)
    linkInfo.lead_no = str((detail as Record<string, unknown>).lead_no)
    existingOwnerSyncId.value = Number(detail.owner_sync_id || 0)

    if (detail.syq) syq.value = Number(detail.syq) as AcceptSyq
    ownerForm.syr = str(detail.owner_name)
    ownerForm.dh = str(detail.owner_phone)
    ownerForm.sfzmhm = str(detail.owner_id_card)
    ownerForm.dz = str(detail.owner_address)
    ownerForm.sfzmmc = isPersonal.value ? 'A' : 'N'
    vehicleForm.clsbdh = str(detail.vin)
    vehicleForm.hphm = str(detail.plate_no)
    vehicleForm.clpp1 = str(detail.brand)
    vehicleForm.clxh = str(detail.model)
    vehicleForm.ppxh = str(detail.brand_model || `${detail.brand || ''}${detail.model || ''}`)
    vehicleForm.csys = str(detail.color)
    vehicleForm.fdjh = str(detail.engine_no)
    vehicleForm.ccdjrq = str(detail.reg_date)
    vehicleForm.delivery_method = str(detail.delivery_method) || 'self'
    vehicleForm.tow_pickup_address = str(detail.tow_pickup_address)
    vehicleForm.tow_pickup_contact = str(detail.tow_pickup_contact)
    vehicleForm.tow_pickup_phone = str(detail.tow_pickup_phone)
    vehicleForm.self_delivery_address = str(detail.self_delivery_address)
    vehicleForm.self_delivery_name = str(detail.self_delivery_name)
    vehicleForm.self_delivery_phone = str(detail.self_delivery_phone)
    vehicleForm.settlement_type = str(detail.settlement_type) || 'personal'
    vehicleForm.settlement_method = str(detail.settlement_method)
    vehicleForm.settlement_amount = str(detail.settlement_amount)
    vehicleForm.bank_name = str(detail.bank_name)
    vehicleForm.bank_branch = str(detail.bank_branch)
    vehicleForm.bank_card_no = str(detail.bank_card_no)
    vehicleForm.remark = str(detail.remark)
    if (detail.has_agent === 0) hasAgent.value = false
    agentForm.jbr = str(detail.agent_name)
    agentForm.jbrdh = str(detail.agent_phone)
    materialImages.photo_front = str((detail as Record<string, unknown>).photo_front)
    materialImages.photo_side = str((detail as Record<string, unknown>).photo_side)
    materialImages.photo_back = str((detail as Record<string, unknown>).photo_back)
    materialImages.photo_interior = str((detail as Record<string, unknown>).photo_interior)
  }

  /** sync 回显（对齐 admin processAcceptData） */
  function processAcceptData(sync: Awaited<ReturnType<typeof fetchAcceptSyncFiles>>) {
    if (!sync) return
    cjid.value = str(sync.cjid || sync.id)
    if (sync.is_submitted_commerce) isSubmitted.value = true

    const o = sync.owner || {}
    const v = sync.vehicle || {}
    const a = sync.agent || {}
    const ownerImgs = sync.owner_images || {}
    const vehicleImgs = sync.vehicle_images || {}
    const agentImgs = sync.agent_images || {}

    if (o.syq) syq.value = Number(o.syq) as AcceptSyq
    if (o.hplx) hplx.value = Number(o.hplx) as AcceptHplx
    ownerForm.sfzmmc = isPersonal.value ? 'A' : 'N'
    if (o.syr) ownerForm.syr = str(o.syr)
    if (o.sfzmhm) ownerForm.sfzmhm = str(o.sfzmhm)
    if (o.dh) ownerForm.dh = str(o.dh)
    if (o.dz) ownerForm.dz = str(o.dz)
    if (o.sfzmmc) ownerForm.sfzmmc = isPersonal.value ? 'A' : str(o.sfzmmc)
    if (o.hpzl) ownerForm.hpzl = str(o.hpzl)
    if (o.syrsmrz !== undefined && o.syrsmrz !== null) ownerForm.syrsmrz = str(o.syrsmrz)

    const syrImg = imgUrl(ownerImgs.syrzp)
    if (syrImg) {
      if (isPersonal.value) ownerImages.sfz1zp = syrImg
      else ownerImages.syrzp = syrImg
    }
    const sfz1 = imgUrl(ownerImgs.sfz1zp)
    if (sfz1 && isPersonal.value) ownerImages.sfz1zp = sfz1
    const sfz2 = imgUrl(ownerImgs.sfz2zp)
    if (sfz2) ownerImages.sfz2zp = sfz2
    const qksm = imgUrl(ownerImgs.qksmzp)
    if (qksm) ownerImages.qksmzp = qksm

    Object.keys(vehicleForm).forEach((k) => {
      if (v[k] !== undefined && v[k] !== null && v[k] !== '') {
        ;(vehicleForm as Record<string, unknown>)[k] = k === 'ccdjrq' ? formatDate(v[k]) : str(v[k])
      }
    })
    if (v.cllx) {
      vehicleForm.cllx = str(v.cllx)
      cllxPath.value = str(v.cllx)
    }
    if (v.hpzl) {
      vehicleForm.hpzl = str(v.hpzl)
      ownerForm.hpzl = str(v.hpzl)
    }
    const xszzp = imgUrl(vehicleImgs.xszzp)
    if (xszzp) vehicleImages.xszzp = xszzp
    const xszzpfy = imgUrl(vehicleImgs.xszzpfy) || imgUrl(vehicleImgs.tcjczp)
    if (xszzpfy) vehicleImages.xszzpfy = xszzpfy
    const xszbmzp = imgUrl(vehicleImgs.xszbmzp)
    if (xszbmzp) vehicleImages.xszbmzp = xszbmzp
    const czzp = imgUrl(vehicleImgs.czzp)
    if (czzp) vehicleImages.czzp = czzp
    const blpzzp = imgUrl(vehicleImgs.blpzzp) || imgUrl(vehicleImgs.tcjczp)
    if (blpzzp) ownerImages.blpzzp = blpzzp

    if (a.jbr || a.jbrdh || a.jbrsfzmhm || Number(a.has_agent) === 1) hasAgent.value = true
    if (a.jbr) agentForm.jbr = str(a.jbr)
    if (a.jbrsfzmhm) agentForm.jbrsfzmhm = str(a.jbrsfzmhm)
    if (a.jbrdh) agentForm.jbrdh = str(a.jbrdh)
    if (a.jbrsmrz !== undefined && a.jbrsmrz !== null) agentForm.jbrsmrz = str(a.jbrsmrz)
    const jbr1 = imgUrl(agentImgs.jbrsfz1zp)
    if (jbr1) agentImages.jbrsfz1zp = jbr1
    const jbr2 = imgUrl(agentImgs.jbrsfz2zp)
    if (jbr2) agentImages.jbrsfz2zp = jbr2
    const jbrzp = imgUrl(agentImgs.jbrzp)
    if (jbrzp) agentImages.jbrzp = jbrzp

    ownerForm.syq = String(syq.value)
    ownerForm.zcbj = hplx.value === 3 ? '0' : '1'
    ownerForm.sfyd = hplx.value === 1 ? '0' : '1'
  }

  async function loadAcceptDataByVehicleId() {
    if (!props.vehicleId) return
    const sync = await fetchAcceptSyncFiles({ vehicle_id: props.vehicleId })
    processAcceptData(sync)
  }

  async function loadScrapFiles() {
    if (!props.vehicleId || scrapFilesLoading.value) return
    scrapFilesLoading.value = true
    try {
      const res = await fetchAcceptFilesCache(props.vehicleId)
      scrapCacheFiles.value = (res.bfcj || {}) as Record<string, { url?: string }>
      scrapDjid.value = str(res.djid)
    } catch {
      scrapCacheFiles.value = {}
      scrapDjid.value = ''
    } finally {
      scrapFilesLoading.value = false
    }
  }

  /** 打开流程：对齐 admin VehicleArchiveEdit.open */
  async function openEditor() {
    if (!props.vehicleId) return
    if (props.vehicleRow?.owner_sync_id) {
      existingOwnerSyncId.value = Number(props.vehicleRow.owner_sync_id)
    }
    if (Number(props.vehicleRow?.is_submitted_commerce) === 1) {
      isSubmitted.value = true
    }
    loading.value = true
    try {
      await loadVehicleData()

      let echo: { hplx?: number; syq?: number; is_submitted_commerce?: number } | null = null
      if (existingOwnerSyncId.value) {
        try {
          const sync = await fetchAcceptSyncFiles({ vehicle_id: props.vehicleId })
          const owner = sync.owner || {}
          echo = {
            hplx: owner.hplx ? Number(owner.hplx) : undefined,
            syq: owner.syq ? Number(owner.syq) : undefined,
            is_submitted_commerce: Number(sync.is_submitted_commerce || 0)
          }
        } catch {
          echo = null
        }
      }

      // 属地回显：优先 sywd/zcbj
      try {
        const origin = await fetchAcceptOriginFields({ vehicle_id: props.vehicleId })
        if (String(origin.zcbj) === '0') hplx.value = 3
        else if (String(origin.sywd) === '1') hplx.value = 2
        else if (String(origin.sywd) === '0') hplx.value = 1
        else if (echo?.hplx) hplx.value = echo.hplx as AcceptHplx
        if (origin.syq) syq.value = Number(origin.syq) as AcceptSyq
        else if (echo?.syq) syq.value = echo.syq as AcceptSyq
      } catch {
        if (echo?.hplx) hplx.value = echo.hplx as AcceptHplx
        if (echo?.syq) syq.value = echo.syq as AcceptSyq
      }

      if (echo?.is_submitted_commerce === 1) {
        isSubmitted.value = true
        phase.value = 'form'
        await loadOptions()
        await loadAcceptDataByVehicleId()
        await loadScrapFiles()
        return
      }

      // 未提交：先场景选择（对齐 admin）
      phase.value = 'scene'
    } finally {
      loading.value = false
    }
  }

  async function confirmScene() {
    if (!props.vehicleId) {
      ElMessage.warning('缺少车辆 ID')
      return
    }
    initLoading.value = true
    try {
      const res = await fetchAcceptInitForm({
        hplx: hplx.value,
        syq: syq.value,
        vehicle_id: props.vehicleId
      })
      cjid.value = str(res.cjid)
      acceptTime.value = new Date().toLocaleString('zh-CN').replace(/\//g, '-').slice(0, 16)
      ownerForm.syq = String(syq.value)
      ownerForm.sfzmmc = isPersonal.value ? 'A' : 'N'
      ownerForm.zcbj = hplx.value === 3 ? '0' : '1'
      ownerForm.sfyd = hplx.value === 1 ? '0' : '1'
      await loadOptions()
      // 已有受理记录才回显 sync；新建受理用详情默认值
      if (existingOwnerSyncId.value) {
        await loadAcceptDataByVehicleId()
      }
      // 场景选择覆盖
      syq.value = Number(syq.value) as AcceptSyq
      ownerForm.syq = String(syq.value)
      ownerForm.sfzmmc = isPersonal.value ? 'A' : 'N'
      phase.value = 'form'
      step.value = 1
      emit('success')
    } finally {
      initLoading.value = false
    }
  }

  function onAgentToggle(val: boolean) {
    if (!val) {
      agentForm.jbr = ''
      agentForm.jbrsfzmhm = ''
      agentForm.jbrdh = ''
      agentForm.jbrsmrz = ''
      agentImages.jbrsfz1zp = ''
      agentImages.jbrsfz2zp = ''
      agentImages.jbrzp = ''
    }
  }

  async function handleMaterialUpload(field: string, file: File) {
    const url = await fetchAcceptUploadImage({
      file,
      vehicle_id: props.vehicleId,
      field
    })
    if (url) (materialImages as Record<string, string>)[field] = url
  }

  function handleMaterialRemove(field: string) {
    ;(materialImages as Record<string, string>)[field] = ''
  }

  function handleCertificateAction() {
    if (!scrapDjid.value) {
      ElMessage.warning('暂无回收证明数据')
      return
    }
    window.open(`https://bfc.chexinmeng.com/hszma4?id=${scrapDjid.value}`, '_blank')
  }

  async function handleOwnerUpload(field: string, file: File) {
    const url = await fetchAcceptUploadImage({
      file,
      vehicle_id: props.vehicleId,
      field
    })
    if (url) {
      ownerImages[field] = url
      // 个人正面同步到 syrzp，保存时 mapOwnerFields 会一并提交
      if (field === 'sfz1zp') ownerImages.syrzp = url
    }
  }

  async function handleVehicleUpload(field: string, file: File) {
    const url = await fetchAcceptUploadImage({
      file,
      vehicle_id: props.vehicleId,
      field
    })
    if (url) vehicleImages[field] = url
  }

  async function handleAgentUpload(field: string, file: File) {
    const url = await fetchAcceptUploadImage({
      file,
      vehicle_id: props.vehicleId,
      field
    })
    if (url) agentImages[field] = url
  }

  const OWNER_OCR_KEY: Record<string, string> = {
    syrzp: 'license',
    sfz1zp: 'id_front',
    sfz2zp: 'id_back'
  }
  const VEHICLE_OCR_KEY: Record<string, string> = {
    xszzp: 'driving_front',
    xszzpfy: 'driving_back',
    xszbmzp: 'driving_both',
    czzp: 'cert'
  }
  const AGENT_OCR_KEY: Record<string, string> = {
    jbrsfz1zp: 'agent_front',
    jbrsfz2zp: 'agent_back'
  }

  function handleOwnerRemove(field: string) {
    ownerImages[field] = ''
    if (field === 'sfz1zp') ownerImages.syrzp = ''
    const ocrKey = OWNER_OCR_KEY[field]
    if (ocrKey) {
      delete ocrDone[ocrKey]
      delete ocrLoading[ocrKey]
    }
  }

  function handleVehicleRemove(field: string) {
    vehicleImages[field] = ''
    const ocrKey = VEHICLE_OCR_KEY[field]
    if (ocrKey) {
      delete ocrDone[ocrKey]
      delete ocrLoading[ocrKey]
    }
  }

  function handleAgentRemove(field: string) {
    agentImages[field] = ''
    const ocrKey = AGENT_OCR_KEY[field]
    if (ocrKey) {
      delete ocrDone[ocrKey]
      delete ocrLoading[ocrKey]
    }
  }

  async function runIdCardOcr(side: 'front' | 'back') {
    const url = side === 'front' ? ownerImages.sfz1zp || ownerImages.syrzp : ownerImages.sfz2zp
    if (!url) {
      ElMessage.warning(`请先上传身份证${side === 'front' ? '正面' : '反面'}`)
      return
    }
    const key = side === 'front' ? 'id_front' : 'id_back'
    ocrLoading[key] = true
    try {
      const data = await fetchAcceptRecognizeIdCard(url, side)
      if (side === 'front') {
        applyIdCardFrontResult(data as Record<string, unknown>, ownerForm, true)
        ocrDone[key] = true
        ElMessage.success('OCR识别成功')
      } else if (data.id_number && data.id_number !== ownerForm.sfzmhm) {
        ElMessage.warning('身份证号码不一致，请核实')
      } else {
        ocrDone[key] = true
        ElMessage.success('身份证反面识别成功')
      }
    } finally {
      ocrLoading[key] = false
    }
  }

  async function runLicenseOcr() {
    if (!ownerImages.syrzp) {
      ElMessage.warning('请先上传营业执照原件')
      return
    }
    ocrLoading.license = true
    try {
      const data = await fetchAcceptRecognizeLicense(ownerImages.syrzp)
      applyLicenseOcrResult(data as Record<string, unknown>, ownerForm)
      ocrDone.license = true
      ElMessage.success('OCR识别成功')
    } finally {
      ocrLoading.license = false
    }
  }

  /** 对齐 admin mapOwnerFields */
  function mapOwnerFields() {
    const base: Record<string, unknown> = {
      vehicle_id: props.vehicleId,
      syr: ownerForm.syr || '',
      sfzmhm: ownerForm.sfzmhm || '',
      dh: ownerForm.dh || '',
      dz: ownerForm.dz || '',
      sfzmmc: ownerForm.sfzmmc || (isPersonal.value ? 'A' : 'N'),
      hpzl: vehicleForm.hpzl || ownerForm.hpzl || '',
      syq: String(syq.value),
      zcbj: hplx.value === 3 ? '0' : '1',
      sfyd: hplx.value === 1 ? '0' : '1',
      syrsmrz: ownerForm.syrsmrz || '',
      syrzp: isPersonal.value
        ? ownerImages.sfz1zp || ownerImages.syrzp || ''
        : ownerImages.syrzp || '',
      qksmzp: ownerImages.qksmzp || '',
      xszzp: vehicleImages.xszzp || '',
      tcjczp: vehicleImages.xszzpfy || '',
      xszbmzp: vehicleImages.xszbmzp || '',
      czzp: vehicleImages.czzp || '',
      blpzzp: ownerImages.blpzzp || ''
    }
    if (isPersonal.value) {
      base.sfz1zp = ownerImages.sfz1zp || ownerImages.syrzp || ''
      base.sfz2zp = ownerImages.sfz2zp || ''
    }
    return base
  }

  function mapVehicleFields() {
    return {
      vehicle_id: props.vehicleId,
      hplx: hplx.value,
      ...vehicleForm,
      xszzp: vehicleImages.xszzp || '',
      xszzpfy: vehicleImages.xszzpfy || '',
      xszbmzp: vehicleImages.xszbmzp || '',
      czzp: vehicleImages.czzp || ''
    }
  }

  function mapAgentFields() {
    return {
      vehicle_id: props.vehicleId,
      has_agent: hasAgent.value ? 1 : 0,
      jbr: agentForm.jbr || '',
      jbrsfzmhm: agentForm.jbrsfzmhm || '',
      jbrdh: agentForm.jbrdh || '',
      jbrsmrz: agentForm.jbrsmrz || '',
      jbrzp: agentImages.jbrzp || '',
      jbrsfz1zp: agentImages.jbrsfz1zp || '',
      jbrsfz2zp: agentImages.jbrsfz2zp || ''
    }
  }

  async function runDrivingOcr(side: 'front' | 'back' | 'both') {
    const fieldMap = {
      front: 'xszzp',
      back: 'xszzpfy',
      both: 'xszbmzp'
    } as const
    const labelMap = {
      front: '正页',
      back: '副页',
      both: '正副背面'
    } as const
    const keyMap = {
      front: 'driving_front',
      back: 'driving_back',
      both: 'driving_both'
    } as const
    const field = fieldMap[side]
    const url = vehicleImages[field]
    if (!url) {
      ElMessage.warning(`请先上传行驶证${labelMap[side]}照片`)
      return
    }
    const key = keyMap[side]
    ocrLoading[key] = true
    try {
      const data = await fetchAcceptRecognizeDrivingLicense(url)
      applyDrivingOcrResult(data as Record<string, unknown>, vehicleForm, ownerForm)
      if (data.vehicle_type) cllxPath.value = str(data.vehicle_type)
      ocrDone[key] = true
      ElMessage.success('OCR识别成功')
    } finally {
      ocrLoading[key] = false
    }
  }

  async function runRegCertOcr() {
    if (!vehicleImages.czzp) {
      ElMessage.warning('请先上传产证一二页照片')
      return
    }
    ocrLoading.cert = true
    try {
      const data = await fetchAcceptRecognizeRegCert(vehicleImages.czzp)
      applyRegCertOcrResult(data as Record<string, unknown>, vehicleForm)
      if (data.vehicle_type) cllxPath.value = str(data.vehicle_type)
      ocrDone.cert = true
      ElMessage.success('OCR识别成功')
    } finally {
      ocrLoading.cert = false
    }
  }

  async function runAgentIdOcr(side: 'front' | 'back') {
    const url = side === 'front' ? agentImages.jbrsfz1zp : agentImages.jbrsfz2zp
    if (!url) {
      ElMessage.warning(`请先上传代理人身份证${side === 'front' ? '正面' : '反面'}`)
      return
    }
    const key = side === 'front' ? 'agent_front' : 'agent_back'
    ocrLoading[key] = true
    try {
      const data = await fetchAcceptRecognizeIdCard(url, side)
      if (side === 'front') {
        applyIdCardFrontResult(data as Record<string, unknown>, agentForm, false)
        ocrDone[key] = true
        ElMessage.success('OCR识别成功')
      } else if (data.id_number && data.id_number !== agentForm.jbrsfzmhm) {
        ElMessage.warning('身份证号码不一致，请核实')
      } else {
        ocrDone[key] = true
        ElMessage.success('身份证反面识别成功')
      }
    } finally {
      ocrLoading[key] = false
    }
  }

  async function saveCurrentStep() {
    if (!props.vehicleId || isSubmitted.value) return
    if (step.value === 1) {
      await fetchAcceptSaveOwner(mapOwnerFields() as never)
    } else if (step.value === 2) {
      await fetchAcceptSaveVehicle(mapVehicleFields() as never)
    } else if (step.value === 3) {
      await fetchAcceptSaveAgent(mapAgentFields() as never)
    }
  }

  async function handleSaveDraft() {
    if (isSubmitted.value) {
      ElMessage.warning('已提交至商务部，不可修改')
      return
    }
    saving.value = true
    try {
      await saveCurrentStep()
      draftSaved.value = true
      ElMessage.success('暂存成功')
    } finally {
      saving.value = false
    }
  }

  async function goToStep(target: number) {
    if (target < 1 || target > 5) return
    step.value = target
    if (target === 5) await loadScrapFiles()
  }

  async function goNext() {
    if (isSubmitted.value) {
      if (step.value < 5) step.value += 1
      return
    }
    saving.value = true
    try {
      await saveCurrentStep()
      draftSaved.value = true
      if (step.value < 5) {
        step.value += 1
        if (step.value === 5) await loadScrapFiles()
      }
    } finally {
      saving.value = false
    }
  }

  function goPrev() {
    if (step.value > 1) step.value -= 1
  }

  function openAuth(type: 'syr' | 'dlr') {
    if (isSubmitted.value) return
    const person = type === 'syr' ? ownerForm.syr : agentForm.jbr
    if (!person) {
      ElMessage.warning('请先填写认证人信息')
      return
    }
    authType.value = type
    authPhone.value = type === 'syr' ? ownerForm.dh : agentForm.jbrdh
    authSmsChecked.value = true
    authQrChecked.value = false
    authSmsCountdown.value = 0
    authVisible.value = true
  }

  function onAuthSmsModeChange(val: boolean) {
    if (val) authQrChecked.value = false
    else authQrChecked.value = true
  }

  function onAuthQrModeChange(val: boolean) {
    if (val) authSmsChecked.value = false
    else authSmsChecked.value = true
  }

  function handleAuthDialogClosed() {
    if (authSmsTimer) {
      clearInterval(authSmsTimer)
      authSmsTimer = null
    }
    authSmsCountdown.value = 0
    loadAcceptDataByVehicleId()
  }

  async function handleAuthSendSms() {
    if (!authPhone.value.trim()) {
      ElMessage.warning('请输入手机号')
      return
    }
    if (!/^1[3-9]\d{9}$/.test(authPhone.value)) {
      ElMessage.warning('手机号格式不正确')
      return
    }
    if (!cjid.value) {
      ElMessage.warning('受理记录初始化中，请稍后重试')
      return
    }
    authSending.value = true
    try {
      await fetchAcceptAuthSms({
        cjid: cjid.value,
        tel: authPhone.value,
        type: authType.value,
        verifyType: 'sms'
      })
      authSmsCountdown.value = 30
      if (authSmsTimer) clearInterval(authSmsTimer)
      authSmsTimer = setInterval(() => {
        authSmsCountdown.value -= 1
        if (authSmsCountdown.value <= 0 && authSmsTimer) {
          clearInterval(authSmsTimer)
          authSmsTimer = null
        }
      }, 1000)
    } finally {
      authSending.value = false
    }
  }

  async function handleAuthQrScan() {
    if (!authPhone.value.trim()) {
      ElMessage.warning('请输入手机号')
      return
    }
    if (!/^1[3-9]\d{9}$/.test(authPhone.value)) {
      ElMessage.warning('手机号格式不正确')
      return
    }
    if (!cjid.value) {
      ElMessage.warning('受理记录初始化中，请稍后重试')
      return
    }
    authQrLoading.value = true
    try {
      const res = (await fetchAcceptAuthSms({
        cjid: cjid.value,
        tel: authPhone.value,
        type: authType.value,
        verifyType: 'scan'
      })) as Record<string, unknown>
      const result = res?.result
      let url = ''
      if (typeof result === 'string' && result.startsWith('http')) url = result
      else if (result && typeof result === 'object') {
        const r = result as Record<string, string>
        url = r.url || r.authorizeUrl || r.redirectUrl || r.link || r.scanUrl || r.qrUrl || ''
      }
      if (!url) {
        url = String(
          res.url || res.authorizeUrl || res.redirectUrl || res.link || res.scanUrl || ''
        )
      }
      if (url) window.open(url, '_blank')
      else ElMessage.warning('未获取到扫码认证链接')
    } finally {
      authQrLoading.value = false
    }
  }

  async function handleFetchArchive() {
    try {
      await fetchAcceptArchive(props.vehicleId)
    } catch {
      // http 层提示
    }
  }

  async function viewSubmitResult() {
    try {
      submitResult.value = await fetchAcceptSubmitResult(props.vehicleId)
      submitResultVisible.value = true
    } catch {
      // http 层提示
    }
  }

  async function handleSubmit() {
    if (!authCompleted.value) {
      ElMessage.warning('请先完成实名认证')
      return
    }
    if (!props.vehicleId) {
      ElMessage.warning('受理记录未初始化')
      return
    }
    submitting.value = true
    try {
      const res = await fetchAcceptSubmit(props.vehicleId)
      submitResult.value = res
      isSubmitted.value = true
      submitResultVisible.value = true
      emit('success')
    } finally {
      submitting.value = false
    }
  }

  function handleClosed() {
    resetState()
  }

  watch(
    () => props.visible,
    (v) => {
      if (v) {
        resetState()
        acceptTime.value = new Date().toLocaleString('zh-CN').replace(/\//g, '-').slice(0, 16)
        openEditor()
      }
    }
  )
</script>
