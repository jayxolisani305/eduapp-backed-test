// controllers/resources.controller.js
import Resource from '../models/resource.model.js';
import fs from 'fs';

// Create resource
export const createResource = async (req, res) => {
  try {
    console.log('Request body:', req.body);
    console.log('File info:', req.file);
    
    const { topic_id, type, title, url } = req.body;

    // Validate required fields
    if (!topic_id || !type || !title) {
      return res.status(400).json({ 
        message: 'Missing required fields',
        required: ['topic_id', 'type', 'title']
      });
    }

    // Must have either file or URL
    if (!req.file && !url) {
      return res.status(400).json({ 
        message: 'Either file upload or URL is required' 
      });
    }

    const newResource = await Resource.create({
      topic_id: parseInt(topic_id),
      type,
      title,
      file_path: req.file ? req.file.path : null,
      url: url || null
    });

    console.log('Resource created successfully:', newResource);
    res.status(201).json(newResource);
  } catch (err) {
    console.error('Error creating resource:', err);
    console.error('Error stack:', err.stack);
    res.status(500).json({ 
      message: 'Server error',
      error: err.message // Add error details for debugging
    });
  }
};

// Delete resource
export const deleteResource = async (req, res) => {
  try {
    const { id } = req.params;

    const resource = await Resource.delete(id);
    if (!resource) return res.status(404).json({ message: 'Resource not found' });

    // Remove file from disk if it exists
    if (resource.file_path && fs.existsSync(resource.file_path)) {
      fs.unlinkSync(resource.file_path);
      console.log('File deleted from disk:', resource.file_path);
    }

    res.json({ message: 'Resource deleted successfully' });
  } catch (err) {
    console.error('Error deleting resource:', err);
    res.status(500).json({ 
      message: 'Server error',
      error: err.message
    });
  }
};

// Get resources by topic
export const getResourcesByTopic = async (req, res) => {
  try {
    const { topicId } = req.params;
    
    if (!topicId) {
      return res.status(400).json({ message: 'Topic ID is required' });
    }
    
    const resources = await Resource.getByTopic(parseInt(topicId));
    console.log(`Found ${resources.length} resources for topic ${topicId}`);
    res.json(resources);
  } catch (err) {
    console.error('Error getting resources:', err);
    res.status(500).json({ 
      message: 'Server error',
      error: err.message
    });
  }
};