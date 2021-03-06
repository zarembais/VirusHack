const router = require('express').Router();
const mongoose = require('mongoose');
const { Patient } = require('../models/patient');
const { Users } = require('../models/users');
const parser = require('../middleware/img-upload')


router
  .route('/') // карточки профайла
  .get(async (req, res, next) => {
    try {
      const { _id } = req.session.user;
      const user = await Users.findOne({ _id });
      res.send({ patients: user.patients });
    } catch (error) {
      next(error);
    }
  })
  .post(async (req, res, next) => { //создать пациента
    try {
      const { name, surname, age, sex, address, phone, diagnosis, doctorName, doctorSurname, doctorPhone, _id } = req.body;
      const patient = await Patient.create({
        name, surname, sex, age, address, phone, diagnosis, responsiblePerson: _id, doctor: { doctorName, doctorSurname, doctorPhone }
      });
      await Users.updateOne({ _id }, { $push: { patients: [patient] } });
      const updUser = await Users.findOne({ _id })
      res.send(updUser);
    } catch (error) {
      next(error);
    }
  });
router.put('/:id', async (req, res, next) => { // добавить фото
  try {
    const { id, userId, imageUrl } = req.body;
    await Patient.updateOne({ _id: id }, { $set: { image: imageUrl } });
    const patient = await Patient.findOne({ _id: id });
    await Users.updateOne({ _id: userId, 'patients._id': id }, { $set: { 'patients.$': [patient] } });
    const user = await Users.findOne({ _id: userId });
    res.send({ user });
  } catch (error) {
    next(error);
  }
});

router.post('/upload', parser.single('file'), async (req, res, next) => { // добавить фото
  try {
    const image = {};
    image.url = req.file.url;
    image.id = req.file.public_id;
    res.send({ imageUrl: image.url });
  } catch (error) {
    next(error);
  }
});

router
  .route('/:id/pain')
  .get(async (req, res, next) => {
    try {
      const _id = req.params.id;
      const patient = await Patient.findOne({ _id });
      res.send({ painStatistics: patient.painStatistics });
    } catch (error) {
      next(error);
    }
  })
  .put(async (req, res, next) => {
    try {
      const { options, id, userId } = req.body;
      await Patient.updateOne({ _id: id }, { $push: { painStatistics: [options] } });
      const patient = await Patient.findOne({ _id });
      await Users.updateOne({ _id: userId, 'patients._id': id }, { $set: { 'patients.$': [patient] } });
      res.send({ painStatistics: patient.painStatistics });
    } catch (error) {
      next(error);
    }
  });
  
router.put('/:id/carePlan', async (req, res, next) => {
  try {
    const { id, schedules, userId } = req.body;
    await Patient.updateOne({ _id: id }, { $set: { carePlan: schedules } });
    const patient = await Patient.findOne({ _id: id });
    await Users.updateOne({ _id: userId, 'patients._id': id }, { $set: { 'patients.$': [patient] } });
    res.sendStatus(200);
  } catch (error) {
    next(error);
  }
});



module.exports = router;
