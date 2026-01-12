
const Stream = require('../../../models/Stream.model');   
const Subject = require('../../../models/Subject.model');
const { AppError } = require('../../../utils/apiError');
const Chapter = require('../../../models/Chapter.model')
const Topic = require('../../../models/Topic.model')


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
// exports.createSubject = async (req, res, next) => {
//   try {
    
//     const { name, streamId, iconUrl, id, boardClass } = req.body;
//     // Verify Stream Exists
//     const stream = await Stream.findById(streamId);
//     if (!stream) throw new AppError('Stream not found', 404);

//     const subject = await Subject.create({
//       id: id || `SUB-${Date.now()}`, 
//       boardClass: boardClass || 'General', 
//       name,
//       stream: stream.name, 
//       stream_id: streamId,
//       icon_url: iconUrl
//     });

//     res.status(201).json({ status: 'success', data: subject });
//   } catch (err) { next(err); }
// };

exports.createSubject = async (req, res, next) => {
  try {
    const { name, streamId, description } = req.body;
    
    // 🟢 1. Check if an image file was uploaded
    let imageUrl = '';
    if (req.file) {
      imageUrl = req.file.path; // Cloudinary URL
    }

    const newSubject = await Subject.create({
      name,
      stream: streamId,
      description,
      image: imageUrl // Save URL
    });

    res.status(201).json({
      status: 'success',
      data: newSubject
    });
  } catch (error) {
    next(error);
  }
};




exports.updateSubjectImage = async (req, res, next) => {
  try {
    // Check if file is present
    if (!req.file) {
      return res.status(400).json({ status: 'fail', message: 'No image file provided' });
    }

    const subjectId = req.params.id;
    const imageUrl = req.file.path; // New Cloudinary URL

    const updatedSubject = await Subject.findByIdAndUpdate(
      subjectId,
      { image: imageUrl },
      { new: true }
    );

    if (!updatedSubject) {
      return res.status(404).json({ status: 'fail', message: 'Subject not found' });
    }

    res.status(200).json({
      status: 'success',
      message: 'Subject image updated successfully',
      data: updatedSubject
    });
  } catch (error) {
    next(error);
  }
};



exports.getSubjectsByStream = async (req, res, next) => {
  try {
    const { streamId } = req.params;
    const subjects = await Subject.find({ stream_id: streamId });
    res.status(200).json({ status: 'success', data: subjects });
  } catch (err) { next(err); }
};




exports.updateChapterBanner = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ status: 'fail', message: 'No image file provided' });
    }

    const chapterId = req.params.id;
    const bannerUrl = req.file.path;

    const updatedChapter = await Chapter.findByIdAndUpdate(
      chapterId,
      { banner: bannerUrl },
      { new: true } // Return the updated doc
    );

    if (!updatedChapter) {
      return res.status(404).json({ status: 'fail', message: 'Chapter not found' });
    }

    res.status(200).json({
      status: 'success',
      data: updatedChapter
    });
  } catch (error) {
    next(error);
  }
};




exports.updateTopicBanner = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ status: 'fail', message: 'No image file provided' });
    }

    const topicId = req.params.id;
    const imageUrl = req.file.path;

    const updatedTopic = await Topic.findByIdAndUpdate(
      topicId,
      { image: imageUrl },
      { new: true } // Return the updated doc
    );

    if (!updatedTopic) {
      return res.status(404).json({ status: 'fail', message: 'Chapter not found' });
    }

    res.status(200).json({
      status: 'success',
      data: updatedTopic
    });
  } catch (error) {
    next(error);
  }
};