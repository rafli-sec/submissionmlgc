const predictClassification = require('../services/inferenceService');
const crypto = require('crypto');
const storeData = require('../services/storeData');  

async function postPredictHandler(request, h) {
  const { image } = request.payload; 
  const { model } = request.server.app;  

  let confidenceScore, result, suggestion;

  try {
    const predictionResult = await predictClassification(model, image);
    confidenceScore = predictionResult.confidenceScore;
    result = predictionResult.result;  // Perubahan: ganti label menjadi result
    suggestion = predictionResult.suggestion;
  } catch (error) {
    console.error('Error during prediction:', error);
    return h.response({
      status: 'fail',
      message: 'Terjadi kesalahan dalam melakukan prediksi, silakan coba lagi dengan gambar yang sesuai.',
    }).code(400);  
  }

  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  const data = {
    id,
    result,  // Perubahan: ganti label menjadi result
    suggestion,
    createdAt
  };

  try {
    await storeData(id, data); 
  } catch (error) {
    console.error('Error while saving to database:', error);
    return h.response({
      status: 'fail',
      message: 'Terjadi kesalahan saat menyimpan hasil prediksi ke database.',
    }).code(500);  
  }

  const message = "Model is predicted successfully";

  const response = h.response({
    status: 'success',
    message: message,
    data: {
      id,
      result,  // Perubahan: ganti label menjadi result
      suggestion: suggestion,
      createdAt
    }
  });

  response.code(201);  
  return response;
}

module.exports = postPredictHandler;
