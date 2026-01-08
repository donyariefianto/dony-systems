/**
 * KONSTANTA TIPE SUMBER DATA
 * Gunakan ini agar tidak typo saat mendefinisikan source.
 */
export const SOURCE_TYPES = {
 DATABASE: 'database',
 API: 'api_external',
 STATIC: 'static',
}

/**
 * HELPER UTAMA: Widget Config Builder
 * Mengubah parameter menjadi JSON Object siap simpan.
 * Helper ini menstandarisasi format data_config agar seragam.
 */
export const WidgetConfigBuilder = {
 /**
  * 1. CONFIG UNTUK DATABASE (MongoDB Aggregation)
  * @param {string} collection - Nama collection target (misal: 'transactions')
  * @param {Array} pipeline - Array Aggregation Pipeline MongoDB
  * @param {Object} mapping - Mapping field output ke format widget
  * @param {string} [mapping.label_field] - Field untuk label (sumbu X / Nama)
  * @param {string} [mapping.value_field] - Field untuk nilai (sumbu Y / Angka)
  * @param {string} [mapping.trend_field] - (Opsional) Field untuk trend (+/-)
  */
 database: (collection, pipeline, mapping = {}) => {
  if (!collection) throw new Error('Collection name is required')
  if (!Array.isArray(pipeline)) throw new Error('Pipeline must be an array')

  return {
   source: SOURCE_TYPES.DATABASE,
   collection: collection,
   pipeline: pipeline,
   mapping: {
    label_field: mapping.label_field || '_id',
    value_field: mapping.value_field || 'count',
    trend_field: mapping.trend_field || null,
   },
  }
 },

 /**
  * 2. CONFIG UNTUK EXTERNAL API
  * @param {string} url - Endpoint URL target
  * @param {string} method - 'GET', 'POST', dll.
  * @param {Object} mapping - Mapping field dari response API
  */
 api: (url, method = 'GET', mapping = {}) => {
  if (!url) throw new Error('URL is required')

  return {
   source: SOURCE_TYPES.API,
   url: url,
   method: method,
   headers: { 'Content-Type': 'application/json' },
   mapping: {
    label_field: mapping.label_field || 'name',
    value_field: mapping.value_field || 'value',
    trend_field: mapping.trend_field || null,
   },
  }
 },

 /**
  * 3. CONFIG UNTUK STATIC DATA (Hardcoded / Dummy)
  * Berguna untuk preview widget di registry.
  * @param {Array|Object} data - Array object data langsung atau Object (untuk graph/sankey)
  */
 staticData: (data) => {
  // Validasi longgar karena format data ECharts beragam (Array vs Object)
  if (!data) throw new Error('Data is required')

  return {
   source: SOURCE_TYPES.STATIC,
   static_data: data,
  }
 },
}
