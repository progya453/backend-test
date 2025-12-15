const Stream = require('../../../models/Stream.model');   // Adjust ../ based on depth
const Subject = require('../../../models/Subject.model');
const { AppError } = require('../../../utils/apiError');

// --- STREAMS ---
exports.createStream = async (req, res, next) => {
  try {
    const stream = await Stream.create(req.body);
    res.status(201).json({ status: 'success', data: stream });
  } catch (err) { next(err); }
};

exports.getAllStreams = async (req, res, next) => {
  try {
    const streams = await Stream.find().sort('order');
    res.status(200).json({ status: 'success', results: streams.length, data: streams });
  } catch (err) { next(err); }
};

// --- SUBJECTS ---
exports.createSubject = async (req, res, next) => {
  try {
    const { name, streamId, iconUrl } = req.body;
    
    // Verify Stream Exists
    const stream = await Stream.findById(streamId);
    if (!stream) throw new AppError('Stream not found', 404);

    const subject = await Subject.create({
      name,
      stream: stream.name, // Denormalized for easier querying
      stream_id: streamId,
      icon_url: iconUrl
    });

    res.status(201).json({ status: 'success', data: subject });
  } catch (err) { next(err); }
};

exports.getSubjectsByStream = async (req, res, next) => {
  try {
    const { streamId } = req.params;
    const subjects = await Subject.find({ stream_id: streamId });
    res.status(200).json({ status: 'success', data: subjects });
  } catch (err) { next(err); }
};