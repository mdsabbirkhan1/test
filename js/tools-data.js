// Tools Data Management
// Each tool has: category, id, name, icon, description, link, rating, badge, features, pricing, dateAdded

// Development Tools
const developmentTools = [
    {
        category: 'development',
        id: 'vscode',
        name: 'Visual Studio Code',
        icon: 'fas fa-code',
        description: 'A powerful and free code editor with extensive extensions, debugging capabilities, and Git integration.',
        link: 'https://code.visualstudio.com/',
        rating: 4.9,
        badge: 'free',
        features: ['IntelliSense', 'Debugging', 'Git Integration', 'Extensions'],
        pricing: 'Free',
        dateAdded: '2024-01-15'
    },
    {
        category: 'development',
        id: 'github',
        name: 'GitHub',
        icon: 'fab fa-github',
        description: 'The world\'s leading software development platform for version control and collaboration.',
        link: 'https://github.com/',
        rating: 4.8,
        badge: 'freemium',
        features: ['Version Control', 'Collaboration', 'CI/CD', 'Issue Tracking'],
        pricing: 'Free with paid plans',
        dateAdded: '2024-01-10'
    },
    {
        category: 'development',
        id: 'postman',
        name: 'Postman',
        icon: 'fas fa-paper-plane',
        description: 'A comprehensive API development environment for testing, documenting, and sharing APIs.',
        link: 'https://www.postman.com/',
        rating: 4.7,
        badge: 'freemium',
        features: ['API Testing', 'Documentation', 'Monitoring', 'Mock Servers'],
        pricing: 'Free with paid plans',
        dateAdded: '2024-01-12'
    },
    {
        category: 'development',
        id: 'figma',
        name: 'Figma',
        icon: 'fas fa-pencil-ruler',
        description: 'A collaborative interface design tool that works in the browser with real-time collaboration.',
        link: 'https://www.figma.com/',
        rating: 4.8,
        badge: 'freemium',
        features: ['Design', 'Collaboration', 'Prototyping', 'Components'],
        pricing: 'Free with paid plans',
        dateAdded: '2024-01-08'
    },
    {
        category: 'development',
        id: 'docker',
        name: 'Docker',
        icon: 'fab fa-docker',
        description: 'A platform for developing, shipping, and running applications using containerization.',
        link: 'https://www.docker.com/',
        rating: 4.6,
        badge: 'freemium',
        features: ['Containerization', 'Deployment', 'Scalability', 'Isolation'],
        pricing: 'Free with paid plans',
        dateAdded: '2024-01-14'
    }
];

// Design Tools
const designTools = [
    {
        category: 'design',
        id: 'canva',
        name: 'Canva',
        icon: 'fas fa-palette',
        description: 'Easy-to-use design platform for creating graphics, presentations, posters, and social media content.',
        link: 'https://www.canva.com/',
        rating: 4.7,
        badge: 'freemium',
        features: ['Templates', 'Drag & Drop', 'Brand Kit', 'Collaboration'],
        pricing: 'Free with paid plans',
        dateAdded: '2024-01-11'
    },
    {
        category: 'design',
        id: 'adobe-photoshop',
        name: 'Adobe Photoshop',
        icon: 'fas fa-image',
        description: 'Industry-standard image editing software for professional photo editing and digital art creation.',
        link: 'https://www.adobe.com/products/photoshop.html',
        rating: 4.5,
        badge: 'premium',
        features: ['Photo Editing', 'Digital Art', 'Filters', 'Layers'],
        pricing: '$20.99/month',
        dateAdded: '2024-01-05'
    },
    {
        category: 'design',
        id: 'sketch',
        name: 'Sketch',
        icon: 'fas fa-draw-polygon',
        description: 'A digital design toolkit for creating user interfaces, websites, and icons on Mac.',
        link: 'https://www.sketch.com/',
        rating: 4.4,
        badge: 'premium',
        features: ['UI Design', 'Symbols', 'Prototyping', 'Plugins'],
        pricing: '$99/year',
        dateAdded: '2024-01-07'
    },
    {
        category: 'design',
        id: 'unsplash',
        name: 'Unsplash',
        icon: 'fas fa-camera',
        description: 'A platform offering beautiful, free high-resolution photos for any project.',
        link: 'https://unsplash.com/',
        rating: 4.8,
        badge: 'free',
        features: ['High Quality', 'Free License', 'Search', 'Collections'],
        pricing: 'Free',
        dateAdded: '2024-01-09'
    },
    {
        category: 'design',
        id: 'dribbble',
        name: 'Dribbble',
        icon: 'fab fa-dribbble',
        description: 'A community for designers to share their work, discover inspiration, and connect with others.',
        link: 'https://dribbble.com/',
        rating: 4.6,
        badge: 'freemium',
        features: ['Portfolio', 'Inspiration', 'Jobs', 'Community'],
        pricing: 'Free with paid plans',
        dateAdded: '2024-01-13'
    }
];

// Productivity Tools
const productivityTools = [
    {
        category: 'productivity',
        id: 'notion',
        name: 'Notion',
        icon: 'fas fa-sticky-note',
        description: 'An all-in-one workspace for notes, tasks, wikis, and databases to organize your life and work.',
        link: 'https://www.notion.so/',
        rating: 4.7,
        badge: 'freemium',
        features: ['Notes', 'Databases', 'Templates', 'Collaboration'],
        pricing: 'Free with paid plans',
        dateAdded: '2024-01-16'
    },
    {
        category: 'productivity',
        id: 'trello',
        name: 'Trello',
        icon: 'fab fa-trello',
        description: 'A visual project management tool that uses boards, lists, and cards to organize tasks.',
        link: 'https://trello.com/',
        rating: 4.5,
        badge: 'freemium',
        features: ['Kanban Boards', 'Collaboration', 'Automation', 'Power-Ups'],
        pricing: 'Free with paid plans',
        dateAdded: '2024-01-04'
    },
    {
        category: 'productivity',
        id: 'slack',
        name: 'Slack',
        icon: 'fab fa-slack',
        description: 'A messaging platform for teams that brings all communication together in one place.',
        link: 'https://slack.com/',
        rating: 4.6,
        badge: 'freemium',
        features: ['Messaging', 'Channels', 'File Sharing', 'Integrations'],
        pricing: 'Free with paid plans',
        dateAdded: '2024-01-06'
    },
    {
        category: 'productivity',
        id: 'todoist',
        name: 'Todoist',
        icon: 'fas fa-check-circle',
        description: 'A powerful task manager that helps you organize your projects and increase productivity.',
        link: 'https://todoist.com/',
        rating: 4.4,
        badge: 'freemium',
        features: ['Task Management', 'Projects', 'Labels', 'Filters'],
        pricing: 'Free with paid plans',
        dateAdded: '2024-01-17'
    },
    {
        category: 'productivity',
        id: 'google-workspace',
        name: 'Google Workspace',
        icon: 'fab fa-google',
        description: 'A suite of cloud computing, productivity and collaboration tools developed by Google.',
        link: 'https://workspace.google.com/',
        rating: 4.5,
        badge: 'freemium',
        features: ['Email', 'Documents', 'Sheets', 'Drive'],
        pricing: 'Free with paid plans',
        dateAdded: '2024-01-03'
    }
];

// Marketing Tools
const marketingTools = [
    {
        category: 'marketing',
        id: 'mailchimp',
        name: 'Mailchimp',
        icon: 'fas fa-envelope',
        description: 'An all-in-one marketing platform for email marketing, automation, and audience management.',
        link: 'https://mailchimp.com/',
        rating: 4.3,
        badge: 'freemium',
        features: ['Email Marketing', 'Automation', 'Analytics', 'Landing Pages'],
        pricing: 'Free with paid plans',
        dateAdded: '2024-01-18'
    },
    {
        category: 'marketing',
        id: 'hootsuite',
        name: 'Hootsuite',
        icon: 'fas fa-share-alt',
        description: 'A social media management platform for scheduling, managing, and analyzing social media content.',
        link: 'https://hootsuite.com/',
        rating: 4.2,
        badge: 'freemium',
        features: ['Social Scheduling', 'Analytics', 'Team Collaboration', 'Monitoring'],
        pricing: 'Free with paid plans',
        dateAdded: '2024-01-02'
    },
    {
        category: 'marketing',
        id: 'google-analytics',
        name: 'Google Analytics',
        icon: 'fas fa-chart-line',
        description: 'A web analytics service that tracks and reports website traffic and user behavior.',
        link: 'https://analytics.google.com/',
        rating: 4.4,
        badge: 'free',
        features: ['Traffic Analysis', 'User Behavior', 'Conversion Tracking', 'Reports'],
        pricing: 'Free',
        dateAdded: '2024-01-19'
    },
    {
        category: 'marketing',
        id: 'hubspot',
        name: 'HubSpot',
        icon: 'fas fa-bullhorn',
        description: 'A comprehensive CRM platform with marketing, sales, and service tools for growing businesses.',
        link: 'https://www.hubspot.com/',
        rating: 4.5,
        badge: 'freemium',
        features: ['CRM', 'Marketing Automation', 'Sales Pipeline', 'Customer Service'],
        pricing: 'Free with paid plans',
        dateAdded: '2024-01-01'
    },
    {
        category: 'marketing',
        id: 'buffer',
        name: 'Buffer',
        icon: 'fas fa-calendar-alt',
        description: 'A simple social media management tool for scheduling posts and analyzing performance.',
        link: 'https://buffer.com/',
        rating: 4.3,
        badge: 'freemium',
        features: ['Post Scheduling', 'Analytics', 'Team Management', 'Content Calendar'],
        pricing: 'Free with paid plans',
        dateAdded: '2024-01-20'
    }
];

// AI Tools
const aiTools = [
    {
        category: 'ai',
        id: 'chatgpt',
        name: 'ChatGPT',
        icon: 'fas fa-robot',
        description: 'An AI chatbot that can answer questions, write content, and assist with various tasks.',
        link: 'https://chat.openai.com/',
        rating: 4.6,
        badge: 'freemium',
        features: ['Conversational AI', 'Content Writing', 'Code Generation', 'Problem Solving'],
        pricing: 'Free with paid plans',
        dateAdded: '2024-01-21'
    },
    {
        category: 'ai',
        id: 'midjourney',
        name: 'Midjourney',
        icon: 'fas fa-magic',
        description: 'An AI art generator that creates images from text descriptions.',
        link: 'https://www.midjourney.com/',
        rating: 4.5,
        badge: 'premium',
        features: ['AI Art Generation', 'Text to Image', 'Style Control', 'High Quality'],
        pricing: 'Starting at $10/month',
        dateAdded: '2024-01-22'
    },
    {
        category: 'ai',
        id: 'grammarly',
        name: 'Grammarly',
        icon: 'fas fa-spell-check',
        description: 'An AI-powered writing assistant that helps improve grammar, clarity, and tone.',
        link: 'https://www.grammarly.com/',
        rating: 4.4,
        badge: 'freemium',
        features: ['Grammar Check', 'Tone Detection', 'Plagiarism Check', 'Writing Suggestions'],
        pricing: 'Free with paid plans',
        dateAdded: '2024-01-23'
    },
    {
        category: 'ai',
        id: 'copy-ai',
        name: 'Copy.ai',
        icon: 'fas fa-pen-fancy',
        description: 'An AI copywriting tool that helps create marketing copy, blog posts, and social media content.',
        link: 'https://www.copy.ai/',
        rating: 4.2,
        badge: 'freemium',
        features: ['Copy Generation', 'Templates', 'Brand Voice', 'Collaboration'],
        pricing: 'Free with paid plans',
        dateAdded: '2024-01-24'
    },
    {
        category: 'ai',
        id: 'jasper',
        name: 'Jasper',
        icon: 'fas fa-brain',
        description: 'An AI content platform for teams to create better content faster.',
        link: 'https://www.jasper.ai/',
        rating: 4.3,
        badge: 'premium',
        features: ['Content Generation', 'Brand Voice', 'Team Collaboration', 'SEO Optimization'],
        pricing: 'Starting at $39/month',
        dateAdded: '2024-01-25'
    }
];

// Analytics Tools
const analyticsTools = [
    {
        category: 'analytics',
        id: 'tableau',
        name: 'Tableau',
        icon: 'fas fa-chart-bar',
        description: 'A powerful data visualization tool that helps people see and understand their data.',
        link: 'https://www.tableau.com/',
        rating: 4.4,
        badge: 'premium',
        features: ['Data Visualization', 'Interactive Dashboards', 'Data Connections', 'Collaboration'],
        pricing: 'Starting at $70/month',
        dateAdded: '2024-01-26'
    },
    {
        category: 'analytics',
        id: 'power-bi',
        name: 'Power BI',
        icon: 'fas fa-chart-pie',
        description: 'Microsoft\'s business analytics tool for analyzing data and sharing insights.',
        link: 'https://powerbi.microsoft.com/',
        rating: 4.3,
        badge: 'freemium',
        features: ['Business Intelligence', 'Data Modeling', 'Real-time Dashboards', 'Collaboration'],
        pricing: 'Free with paid plans',
        dateAdded: '2024-01-27'
    },
    {
        category: 'analytics',
        id: 'mixpanel',
        name: 'Mixpanel',
        icon: 'fas fa-chart-area',
        description: 'An advanced analytics platform that helps companies track user interactions with web and mobile apps.',
        link: 'https://mixpanel.com/',
        rating: 4.2,
        badge: 'freemium',
        features: ['Event Tracking', 'User Analytics', 'Funnels', 'Cohort Analysis'],
        pricing: 'Free with paid plans',
        dateAdded: '2024-01-28'
    },
    {
        category: 'analytics',
        id: 'hotjar',
        name: 'Hotjar',
        icon: 'fas fa-fire',
        description: 'A behavior analytics tool that helps understand how users interact with your website.',
        link: 'https://www.hotjar.com/',
        rating: 4.3,
        badge: 'freemium',
        features: ['Heatmaps', 'Session Recordings', 'Surveys', 'Feedback'],
        pricing: 'Free with paid plans',
        dateAdded: '2024-01-29'
    },
    {
        category: 'analytics',
        id: 'amplitude',
        name: 'Amplitude',
        icon: 'fas fa-wave-square',
        description: 'A product analytics platform that helps teams build better products through data.',
        link: 'https://amplitude.com/',
        rating: 4.4,
        badge: 'freemium',
        features: ['Product Analytics', 'User Journeys', 'Retention Analysis', 'A/B Testing'],
        pricing: 'Free with paid plans',
        dateAdded: '2024-01-30'
    }
];

// Combine all tools
const allTools = [
    ...developmentTools,
    ...designTools,
    ...productivityTools,
    ...marketingTools,
    ...aiTools,
    ...analyticsTools
];

// Categories configuration
const categories = [
    { id: 'all', name: 'All Tools', icon: 'fas fa-th-large', count: allTools.length },
    { id: 'development', name: 'Development', icon: 'fas fa-code', count: developmentTools.length },
    { id: 'design', name: 'Design', icon: 'fas fa-palette', count: designTools.length },
    { id: 'productivity', name: 'Productivity', icon: 'fas fa-tasks', count: productivityTools.length },
    { id: 'marketing', name: 'Marketing', icon: 'fas fa-bullhorn', count: marketingTools.length },
    { id: 'ai', name: 'AI Tools', icon: 'fas fa-robot', count: aiTools.length },
    { id: 'analytics', name: 'Analytics', icon: 'fas fa-chart-line', count: analyticsTools.length }
];

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { allTools, categories, developmentTools, designTools, productivityTools, marketingTools, aiTools, analyticsTools };
}