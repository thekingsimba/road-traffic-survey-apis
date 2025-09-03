import { Survey } from '../src/controllers/survey/survey.schema.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const migrateSurveyAgents = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all surveys with the old structure
    const surveys = await Survey.find({
      $or: [
        { assignedAgent: { $exists: true } },
        { countingPost: { $exists: true } }
      ]
    });

    console.log(`Found ${surveys.length} surveys to migrate`);

    for (const survey of surveys) {
      console.log(`Migrating survey: ${survey.name} (ID: ${survey._id})`);

      // Create update object
      const updateData = {};

      // Migrate assignedAgent to startPointAgent if countingPost is 'start'
      if (survey.assignedAgent && survey.countingPost === 'start') {
        updateData.startPointAgent = survey.assignedAgent;
        console.log(`  - Moved assignedAgent to startPointAgent: ${survey.assignedAgent}`);
      }

      // Migrate assignedAgent to endPointAgent if countingPost is 'end'
      if (survey.assignedAgent && survey.countingPost === 'end') {
        updateData.endPointAgent = survey.assignedAgent;
        console.log(`  - Moved assignedAgent to endPointAgent: ${survey.assignedAgent}`);
      }

      // If no countingPost specified, assign to startPointAgent as default
      if (survey.assignedAgent && !survey.countingPost) {
        updateData.startPointAgent = survey.assignedAgent;
        console.log(`  - Moved assignedAgent to startPointAgent (default): ${survey.assignedAgent}`);
      }

      // Remove old fields
      updateData.$unset = {
        assignedAgent: 1,
        countingPost: 1
      };

      // Update the survey
      await Survey.findByIdAndUpdate(survey._id, updateData);
      console.log(`  - Migration completed for survey: ${survey.name}`);
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run migration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateSurveyAgents();
}

export default migrateSurveyAgents;
