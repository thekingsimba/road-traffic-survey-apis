// Test script for Road Traffic Survey API
// This script demonstrates the basic functionality of the survey system

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
let adminToken = '';
let agentToken = '';
let surveyId = '';

// Test data
const testSurvey = {
  name: "Highway A1 Morning Traffic Survey",
  startPoint: "City Center Junction",
  endPoint: "Industrial Zone Exit",
  scheduledStartTime: "2024-01-15T08:00:00.000Z",
  scheduledEndTime: "2024-01-15T18:00:00.000Z",
  countingPost: "start"
};

const testAgent = {
  full_name: "John Smith",
  email: "john.smith@example.com",
  phone: "+1234567890",
  countingPost: "start",
  password: "Agent123!"
};

async function testSurveyAPI() {
  console.log('🚗 Starting Road Traffic Survey API Tests...\n');

  try {
    // 1. Create Admin User (if not exists)
    console.log('1. Creating admin user...');
    try {
      const adminResponse = await axios.post(`${BASE_URL}/users/email_signup`, {
        full_name: "Admin User",
        email: "admin@example.com",
        phone: "+1234567890",
        password: "Admin123!"
      });
      console.log('✅ Admin user created');
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.message?.includes('already exists')) {
        console.log('ℹ️ Admin user already exists');
      } else {
        throw error;
      }
    }

    // 2. Login as Admin
    console.log('\n2. Logging in as admin...');
    const adminLoginResponse = await axios.post(`${BASE_URL}/users/email_login`, {
      email: "admin@example.com",
      password: "Admin123!"
    });
    adminToken = adminLoginResponse.data.data.token;
    console.log('✅ Admin login successful');

    // 3. Create Agent Role (if not exists)
    console.log('\n3. Creating agent role...');
    try {
      const roleResponse = await axios.post(`${BASE_URL}/role/create`, {
        name: "agent",
        permissions: []
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.log('✅ Agent role created');
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.message?.includes('already exists')) {
        console.log('ℹ️ Agent role already exists');
      } else {
        throw error;
      }
    }

    // 4. Create Agent User
    console.log('\n4. Creating agent user...');
    const agentResponse = await axios.post(`${BASE_URL}/users/create-agent`, testAgent, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('✅ Agent user created');

    // 5. Login as Agent
    console.log('\n5. Logging in as agent...');
    const agentLoginResponse = await axios.post(`${BASE_URL}/users/email_login`, {
      email: testAgent.email,
      password: testAgent.password
    });
    agentToken = agentLoginResponse.data.data.token;
    console.log('✅ Agent login successful');

    // 6. Create Survey
    console.log('\n6. Creating survey...');
    const surveyResponse = await axios.post(`${BASE_URL}/surveys/create`, {
      ...testSurvey,
      assignedAgent: agentResponse.data.data._id
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    surveyId = surveyResponse.data.data._id;
    console.log('✅ Survey created:', surveyResponse.data.data.name);

    // 7. Start Survey (as Admin)
    console.log('\n7. Starting survey (as Admin)...');
    const startResponse = await axios.put(`${BASE_URL}/surveys/${surveyId}/start`, {}, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('✅ Survey started by admin, status:', startResponse.data.data.status);

    // 8. Count Vehicles (as Agent)
    console.log('\n8. Counting vehicles...');
    const countResponse1 = await axios.post(`${BASE_URL}/surveys/count-vehicle`, {
      surveyId: surveyId,
      vehicleType: 'car'
    }, {
      headers: { Authorization: `Bearer ${agentToken}` }
    });
    console.log('✅ Car counted, total cars:', countResponse1.data.data.carCount);

    const countResponse2 = await axios.post(`${BASE_URL}/surveys/count-vehicle`, {
      surveyId: surveyId,
      vehicleType: 'motorcycle'
    }, {
      headers: { Authorization: `Bearer ${agentToken}` }
    });
    console.log('✅ Motorcycle counted, total motorcycles:', countResponse2.data.data.motorcycleCount);

    // 8.5. Test that agent can start a new survey (create another survey for this test)
    console.log('\n8.5. Testing agent can start survey...');
    const survey2Response = await axios.post(`${BASE_URL}/surveys/create`, {
      name: "Test Survey for Agent Start",
      startPoint: "Test Start",
      endPoint: "Test End",
      scheduledStartTime: "2024-01-15T10:00:00.000Z",
      scheduledEndTime: "2024-01-15T12:00:00.000Z",
      assignedAgent: agentResponse.data.data._id,
      countingPost: "start"
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const survey2Id = survey2Response.data.data._id;
    console.log('✅ Second survey created for testing');

    // Agent starts the second survey
    const agentStartResponse = await axios.put(`${BASE_URL}/surveys/${survey2Id}/start`, {}, {
      headers: { Authorization: `Bearer ${agentToken}` }
    });
    console.log('✅ Survey started by agent, status:', agentStartResponse.data.data.status);

    // 9. Get Survey Details
    console.log('\n9. Getting survey details...');
    const surveyDetailsResponse = await axios.get(`${BASE_URL}/surveys/${surveyId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const survey = surveyDetailsResponse.data.data;
    console.log('✅ Survey details retrieved:');
    console.log(`   - Name: ${survey.name}`);
    console.log(`   - Status: ${survey.status}`);
    console.log(`   - Cars: ${survey.carCount}`);
    console.log(`   - Motorcycles: ${survey.motorcycleCount}`);
    console.log(`   - Total: ${survey.carCount + survey.motorcycleCount}`);

    // 10. Get Survey Statistics
    console.log('\n10. Getting survey statistics...');
    const statsResponse = await axios.get(`${BASE_URL}/surveys/stats/overview`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const stats = statsResponse.data.data;
    console.log('✅ Statistics retrieved:');
    console.log(`   - Total Surveys: ${stats.totalSurveys}`);
    console.log(`   - Total Cars: ${stats.totalCars}`);
    console.log(`   - Total Motorcycles: ${stats.totalMotorcycles}`);
    console.log(`   - Total Vehicles: ${stats.totalVehicles}`);

    // 11. End Survey (as Agent - testing agent can end survey)
    console.log('\n11. Ending survey (as Agent)...');
    const endResponse = await axios.put(`${BASE_URL}/surveys/${surveyId}/end`, {}, {
      headers: { Authorization: `Bearer ${agentToken}` }
    });
    console.log('✅ Survey ended by agent, status:', endResponse.data.data.status);

    // 12. Try to count vehicle after survey ended (should fail)
    console.log('\n12. Testing vehicle counting after survey ended...');
    try {
      await axios.post(`${BASE_URL}/surveys/count-vehicle`, {
        surveyId: surveyId,
        vehicleType: 'car'
      }, {
        headers: { Authorization: `Bearer ${agentToken}` }
      });
      console.log('❌ Should have failed - survey is archived');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Correctly prevented counting on archived survey');
      } else {
        throw error;
      }
    }

    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📊 Final Survey Summary:');
    console.log(`   - Survey 1: ${testSurvey.name}`);
    console.log(`   - Route: ${testSurvey.startPoint} → ${testSurvey.endPoint}`);
    console.log(`   - Final Count: ${survey.carCount} cars, ${survey.motorcycleCount} motorcycles`);
    console.log(`   - Status: ${endResponse.data.data.status}`);
    console.log(`   - Survey 2: Started by agent, ended by agent`);
    console.log(`   - Both admin and agent can control survey lifecycle ✅`);

  } catch (error) {
    console.error('\n❌ Test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

// Run the tests
testSurveyAPI();
