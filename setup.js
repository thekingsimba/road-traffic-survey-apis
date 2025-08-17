// Setup script for Road Traffic Survey API
// This script helps initialize the application with required roles and permissions

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
let adminToken = '';

async function setupApplication() {
  console.log('🔧 Setting up Road Traffic Survey Application...\n');

  try {
    // 1. Create Admin User
    console.log('1. Creating admin user...');
    try {
      const adminResponse = await axios.post(`${BASE_URL}/users/email_signup`, {
        full_name: "System Administrator",
        email: "admin@roadtrafficsurvey.com",
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
      email: "admin@roadtrafficsurvey.com",
      password: "Admin123!"
    });
    adminToken = adminLoginResponse.data.data.token;
    console.log('✅ Admin login successful');

    // 3. Create Admin Role
    console.log('\n3. Creating admin role...');
    try {
      const adminRoleResponse = await axios.post(`${BASE_URL}/role/create`, {
        name: "admin",
        permissions: []
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.log('✅ Admin role created');
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.message?.includes('already exists')) {
        console.log('ℹ️ Admin role already exists');
      } else {
        throw error;
      }
    }

    // 4. Create Agent Role
    console.log('\n4. Creating agent role...');
    try {
      const agentRoleResponse = await axios.post(`${BASE_URL}/role/create`, {
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

    // 5. Create Survey Permissions
    console.log('\n5. Creating survey permissions...');
    const surveyPermissions = [
      { name: "survey_create", description: "Permission to create surveys" },
      { name: "survey_read", description: "Permission to read surveys" },
      { name: "survey_update", description: "Permission to update surveys" },
      { name: "survey_delete", description: "Permission to delete surveys" },
      { name: "survey_start", description: "Permission to start surveys" },
      { name: "survey_end", description: "Permission to end surveys" },
      { name: "vehicle_count", description: "Permission to count vehicles" }
    ];

    for (const permission of surveyPermissions) {
      try {
        await axios.post(`${BASE_URL}/permission/create`, permission, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        console.log(`✅ Permission created: ${permission.name}`);
      } catch (error) {
        if (error.response?.status === 400 && error.response?.data?.message?.includes('already exists')) {
          console.log(`ℹ️ Permission already exists: ${permission.name}`);
        } else {
          console.log(`⚠️ Failed to create permission: ${permission.name}`);
        }
      }
    }

    // 6. Create Sample Agent
    console.log('\n6. Creating sample agent...');
    try {
      const agentResponse = await axios.post(`${BASE_URL}/users/create-agent`, {
        full_name: "Sample Agent",
        email: "agent@roadtrafficsurvey.com",
        phone: "+1234567891",
        countingPost: "start",
        password: "Agent123!"
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.log('✅ Sample agent created');
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.message?.includes('already exists')) {
        console.log('ℹ️ Sample agent already exists');
      } else {
        throw error;
      }
    }

    console.log('\n🎉 Application setup completed successfully!');
    console.log('\n📋 Setup Summary:');
    console.log('   - Admin user: admin@roadtrafficsurvey.com');
    console.log('   - Admin password: Admin123!');
    console.log('   - Sample agent: agent@roadtrafficsurvey.com');
    console.log('   - Agent password: Agent123!');
    console.log('   - Admin and Agent roles created');
    console.log('   - Survey permissions created');
    console.log('\n🚀 You can now start using the application!');

  } catch (error) {
    console.error('\n❌ Setup failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

// Run the setup
setupApplication();
