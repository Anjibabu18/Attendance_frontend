const fs = require('fs');
let c = fs.readFileSync('src/pages/EmployeePage.tsx', 'utf8');

// Import GlobalLoader
if (!c.includes('GlobalLoader')) {
  c = c.replace("import { api } from '../api/client';", "import { api } from '../api/client';\nimport { GlobalLoader } from '../components/GlobalLoader';");
}

// Replace loading block
c = c.replace(/if\s*\(loading\)\s*\{[\s\S]*?return\s*\([\s\S]*?\}\);?\s*\}/, `if (loading) {\n    return <GlobalLoader message="Loading workspace..." />;\n  }`);

// Replace bottom navigation
c = c.replace(/<Box sx=\{\{ display: \{ xs: 'block', md: 'none' \}, position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,[\s\S]*?<\/Box>\s*<\/Box>/, 
`<Box sx={{ display: { xs: 'block', md: 'none' }, position: 'fixed', bottom: 16, left: 16, right: 16, zIndex: 1100 }}>
        <BottomNavigation
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          showLabels
          sx={{
            borderRadius: '24px',
            boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
            height: 72,
            px: 1,
            overflow: 'hidden',
          }}
          className="glass-card"
        >
          {tabs.map((tab, idx) => (
            <BottomNavigationAction 
              key={idx} 
              label={tab.label} 
              icon={tab.icon} 
              sx={{ 
                color: activeTab === idx ? 'primary.main' : 'text.secondary',
                '& .MuiBottomNavigationAction-label': {
                  fontWeight: activeTab === idx ? 800 : 500,
                  fontSize: activeTab === idx ? '0.75rem' : '0.7rem',
                  mt: 0.5,
                  transition: 'all 0.3s ease',
                },
                '& .MuiSvgIcon-root': {
                  fontSize: activeTab === idx ? '1.75rem' : '1.5rem',
                  mb: activeTab === idx ? 0 : 0.5,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                }
              }}
            />
          ))}
        </BottomNavigation>
      </Box>`);

fs.writeFileSync('src/pages/EmployeePage.tsx', c);
console.log('Fixed EmployeePage.tsx');
