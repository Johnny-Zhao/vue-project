import type { FormFieldSchema, FormModel } from '@/components/formSchemas'
import {
  vehicleDriveTypeOptions,
  vehicleEnergyTypeOptions,
  vehicleStatusOptions,
  vehicleTypeOptions,
} from './constants'
import type { CreateVehiclePayload, VehicleQueryForm } from './types'

// 构建列表筛选表单项。
export function createVehicleQueryFields(): FormFieldSchema[] {
  return [
    {
      key: 'plateNumber',
      label: '车牌号',
      type: 'input',
      defaultValue: '',
      componentProps: {
        maxlength: 20,
      },
    },
    {
      key: 'vehicleType',
      label: '车辆类型',
      type: 'select',
      defaultValue: '',
      options: [{ label: '全部类型', value: '' }, ...vehicleTypeOptions],
    },
    {
      key: 'driveType',
      label: '驱动形式',
      type: 'select',
      defaultValue: '',
      options: [{ label: '全部驱动形式', value: '' }, ...vehicleDriveTypeOptions],
    },
    {
      key: 'energyType',
      label: '能源类型',
      type: 'select',
      defaultValue: '',
      options: [{ label: '全部能源类型', value: '' }, ...vehicleEnergyTypeOptions],
    },
    {
      key: 'status',
      label: '状态',
      type: 'select',
      defaultValue: '',
      options: [{ label: '全部状态', value: '' }, ...vehicleStatusOptions],
    },
    {
      key: 'createdAtRange',
      label: '创建时间',
      type: 'daterange',
      defaultValue: [],
      componentProps: {
        type: 'daterange',
        valueFormat: 'YYYY-MM-DDTHH:mm:ss.sssZ',
        startPlaceholder: '开始时间',
        endPlaceholder: '结束时间',
      },
    },
    {
      key: 'updatedAtRange',
      label: '更新时间',
      type: 'daterange',
      defaultValue: [],
      componentProps: {
        type: 'daterange',
        valueFormat: 'YYYY-MM-DDTHH:mm:ss.sssZ',
        startPlaceholder: '开始时间',
        endPlaceholder: '结束时间',
      },
    },
  ]
}

// 构建新增与编辑共用表单项。
export function createVehicleFormFields(): FormFieldSchema[] {
  return [
    {
      key: 'plateNumber',
      label: '车牌号',
      type: 'input',
      required: true,
      defaultValue: '',
      componentProps: {
        maxlength: 20,
      },
    },
    {
      key: 'vehicleType',
      label: '车辆类型',
      type: 'select',
      required: true,
      defaultValue: 'tractor',
      options: vehicleTypeOptions,
    },
    {
      key: 'driveType',
      label: '驱动形式',
      type: 'select',
      required: true,
      defaultValue: '4x2',
      options: vehicleDriveTypeOptions,
    },
    {
      key: 'energyType',
      label: '能源类型',
      type: 'select',
      required: true,
      defaultValue: 'diesel',
      options: vehicleEnergyTypeOptions,
    },
    {
      key: 'brandModel',
      label: '品牌型号',
      type: 'input',
      required: true,
      defaultValue: '',
      componentProps: {
        maxlength: 60,
      },
    },
    {
      key: 'vin',
      label: '车架号',
      type: 'input',
      defaultValue: '',
      componentProps: {
        maxlength: 30,
      },
    },
    {
      key: 'axleCount',
      label: '轴数',
      type: 'number',
      defaultValue: null,
      componentProps: {
        min: 0,
        precision: 0,
      },
    },
    {
      key: 'loadCapacity',
      label: '核载吨位',
      type: 'number',
      defaultValue: null,
      componentProps: {
        min: 0,
        precision: 2,
      },
    },
    {
      key: 'status',
      label: '状态',
      type: 'select',
      required: true,
      defaultValue: 'active',
      options: vehicleStatusOptions,
    },
    {
      key: 'remark',
      label: '备注',
      type: 'textarea',
      defaultValue: '',
      span: 2,
      componentProps: {
        rows: 4,
        maxlength: 300,
        showWordLimit: true,
      },
    },
  ]
}

// 创建默认筛选表单模型。
export function createVehicleQueryInitialValue(): VehicleQueryForm {
  return {
    plateNumber: '',
    vehicleType: '',
    driveType: '',
    energyType: '',
    status: '',
    createdAtRange: [],
    updatedAtRange: [],
  }
}

// 创建默认实体表单模型。
export function createVehicleFormInitialValue(source?: Partial<CreateVehiclePayload>): FormModel {
  return {
    plateNumber: source?.plateNumber ?? '',
    vehicleType: source?.vehicleType ?? 'tractor',
    driveType: source?.driveType ?? '4x2',
    energyType: source?.energyType ?? 'diesel',
    brandModel: source?.brandModel ?? '',
    vin: source?.vin ?? '',
    axleCount: source?.axleCount ?? null,
    loadCapacity: source?.loadCapacity ?? null,
    status: source?.status ?? 'active',
    remark: source?.remark ?? '',
  }
}
