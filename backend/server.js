// API endpoint to check if a user has a specific privilege for an entity
app.get('/check_privilege', async (req, res) => {
  const { userId, entityId, privilege } = req.query;
  
  if (!userId || !privilege) {
    return res.status(400).json({ 
      message: 'Missing required parameters: userId and privilege are required', 
      hasAccess: false 
    });
  }
  
  try {
    // First check if the user exists and get their role
    const userQuery = 'SELECT role FROM Users WHERE user_id = ?';
    const [userRows] = await pool.query(userQuery, [userId]);
    
    if (userRows.length === 0) {
      return res.status(404).json({ 
        message: 'User not found', 
        hasAccess: false 
      });
    }
    
    const userRole = userRows[0].role;
    
    // Global admins have access to everything by default
    if (userRole === 'Global') {
      // Even for Global admins, check if there are specific privileges in the database
      // If privileges exist for this Global admin, use those
      const globalPrivilegeQuery = `
        SELECT * FROM UserPrivileges 
        WHERE user_id = ? AND privilege = ?
      `;
      
      const [globalPrivRows] = await pool.query(globalPrivilegeQuery, [userId, privilege]);
      
      // If there are specific privileges for this Global admin, check if they have this one
      if (globalPrivRows.length > 0) {
        return res.json({ hasAccess: true });
      }
      
      // Otherwise, Global admins have access to everything by default
      return res.json({ hasAccess: true });
    }
    
    // Regular users have no admin privileges
    if (userRole === 'User') {
      return res.json({ hasAccess: false });
    }
    
    // Entity admins need specific privileges in the database
    if (userRole === 'Admin') {
      // For entity admins, check if they have the specific privilege for this entity
      const adminPrivilegeQuery = `
        SELECT * FROM UserPrivileges 
        WHERE user_id = ? AND entity_id = ? AND privilege = ?
      `;
      
      const [adminPrivRows] = await pool.query(adminPrivilegeQuery, [userId, entityId, privilege]);
      
      // User has access if there's at least one matching privilege
      return res.json({ hasAccess: adminPrivRows.length > 0 });
    }
    
    // Default case - no access
    return res.json({ hasAccess: false });
    
  } catch (error) {
    console.error('Error checking privilege:', error);
    res.status(500).json({ 
      message: 'Server error checking privilege', 
      hasAccess: false 
    });
  }
});

// API endpoint to get all privileges for a specific user
app.get('/user_privileges/:userId', async (req, res) => {
  const userId = req.params.userId;
  
  if (!userId) {
    return res.status(400).json({ 
      success: false,
      message: 'User ID is required' 
    });
  }
  
  try {
    // First check if the user exists and get their role
    const userQuery = 'SELECT role, entity_id FROM Users WHERE user_id = ?';
    const [userRows] = await pool.query(userQuery, [userId]);
    
    if (userRows.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }
    
    const { role, entity_id } = userRows[0];
    
    // If user is a Global Admin, they have all privileges by default
    if (role === 'Global') {
      // Check if there are any specific privilege records for this Global admin
      const globalPrivQuery = `
        SELECT privilege FROM UserPrivileges 
        WHERE user_id = ?
      `;
      
      const [globalPrivRows] = await pool.query(globalPrivQuery, [userId]);
      
      if (globalPrivRows.length > 0) {
        // Return the specific privileges defined for this Global admin
        const privileges = globalPrivRows.map(row => row.privilege);
        return res.json({ 
          success: true,
          privileges,
          isGlobal: true
        });
      }
      
      // If no specific privileges are defined, return 'All' to indicate full access
      return res.json({ 
        success: true,
        privileges: ['All'],
        isGlobal: true
      });
    }
    
    // For regular users, they have no admin privileges
    if (role === 'User') {
      return res.json({ 
        success: true,
        privileges: [],
        isUser: true
      });
    }
    
    // For entity admins, fetch their privileges from the database
    const privilegeQuery = `
      SELECT privilege FROM UserPrivileges 
      WHERE user_id = ? AND entity_id = ?
    `;
    
    const [privilegeRows] = await pool.query(privilegeQuery, [userId, entity_id]);
    
    // Map the privileges to an array
    const privileges = privilegeRows.map(row => row.privilege);
    
    res.json({ 
      success: true,
      privileges,
      entityId: entity_id
    });
    
  } catch (error) {
    console.error('Error fetching user privileges:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error fetching privileges' 
    });
  }
}); 