const Job = require('../models/Job');

exports.createJob = async (req, res) => {
  const { title, company, location, description, applicationLink } = req.body;
  try {
    const newJob = await Job.create({ title, company, location, description, applicationLink });
    res.status(201).json(newJob);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getJobs = async (req, res) => {
  try {
    const jobs = await Job.find();
    res.status(200).json(jobs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
