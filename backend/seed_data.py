"""
seed_data.py
────────────
Default seed datasets for TalentForge AI application.
Used to automatically seed the SQLite database on startup if tables are empty.
Allows complete independence from JSON flat-files.
"""

DEFAULT_EMPLOYEES = [
    {
        "employee_id": "E001",
        "name": "Rahul Shah",
        "email": "rahul@aionboarding.com",
        "role": "EMPLOYEE",
        "skills": [
            "React", "Node.js", "GenAI", "REST API", "Git", "Python",
            "Java", "FastAPI", "SQL", "ML", "AI", "PyTorch"
        ],
        "experience": 2.0,
        "status": "Bench",
        "designation": "Full Stack Developer",
        "department": "Engineering",
        "password": "$2b$12$yyvuREXeWgRdSqPDOA/IdO4pANMXSZC5pGlokr54/jUVqocQsuyv."
    },
    {
        "employee_id": "E002",
        "name": "Anita Verma",
        "email": "anita@aionboarding.com",
        "role": "HR",
        "skills": ["Java", "Spring Boot", "AWS"],
        "experience": 4.0,
        "status": "Active",
        "designation": "Backend Developer",
        "department": "HR",
        "password": "$2b$12$nGH1obTvrCT1iwLfEys6YO988EnZ9dFbWVZlmQ1gUXxemMrgHso3u"
    },
    {
        "employee_id": "E003",
        "name": "Priya Nair",
        "email": "priya@aionboarding.com",
        "role": "EMPLOYEE",
        "skills": ["Python", "FastAPI", "GenAI / RAG", "SQL"],
        "experience": 3.0,
        "status": "Bench",
        "designation": "AI/ML Engineer",
        "department": "Data Science",
        "password": "e003123"
    },
    {
        "employee_id": "E004",
        "name": "Vikram Joshi",
        "email": "vikram@aionboarding.com",
        "role": "EMPLOYEE",
        "skills": ["React", "AWS", "Docker", "Node.js"],
        "experience": 5.0,
        "status": "Bench",
        "designation": "DevOps Engineer",
        "department": "Infrastructure",
        "password": "e004123"
    },
    {
        "employee_id": "E005",
        "name": "Sneha Patil",
        "email": "sneha@aionboarding.com",
        "role": "EMPLOYEE",
        "skills": ["Python", "SQL", "Power BI", "React"],
        "experience": 3.0,
        "status": "Bench",
        "designation": "Data Engineer",
        "department": "Analytics",
        "password": "e005123"
    },
    {
        "employee_id": "E006",
        "name": "Arjun Mehta",
        "email": "arjun@aionboarding.com",
        "role": "EMPLOYEE",
        "skills": ["Java", "Spring Boot", "Stripe API", "AWS"],
        "experience": 6.0,
        "status": "Allocated",
        "designation": "Senior Backend Developer",
        "department": "Engineering",
        "password": "e006123"
    },
    {
        "employee_id": "HR001",
        "name": "HR Manager",
        "email": "hr@aionboarding.com",
        "role": "HR",
        "skills": ["Recruiting", "HR Management"],
        "experience": 5.0,
        "status": "Active",
        "designation": "HR Manager",
        "department": "Human Resources",
        "password": "$2b$12$dgZy8yWTZ3V2Lc7sgjtPYuUycW1YowY5420ms/y3GJsNcZ.8w1F0u"
    },
    {
        "employee_id": "ADMIN001",
        "name": "Admin User",
        "email": "admin@aionboarding.com",
        "role": "ADMIN",
        "skills": ["Administration", "Management"],
        "experience": 8.0,
        "status": "Active",
        "designation": "System Administrator",
        "department": "IT",
        "password": "$2b$12$70CnBHcak7G/uvHdtwgI8O68wfPR3L9VVJyP.O1mbVgKl7Sk8W4wS"
    }
]

DEFAULT_PROJECTS = [
    {
        "project_id": "P001",
        "project_name": "AI Talent Matching Platform",
        "project_type": "Internal Innovation",
        "business_unit": "Digital Transformation",
        "domain": "AI / HR Tech",
        "project_overview": {
            "objective": "Build an AI-driven talent-to-project matching system.",
            "problem_statement": "Manual resource allocation causes inefficiencies.",
            "expected_outcomes": [
                "Automated skill matching",
                "Improved deployment speed",
                "Higher utilization rate"
            ]
        },
        "project_duration": {
            "start_date": "2024-01-01",
            "expected_end_date": "2024-06-30",
            "engagement_type": "Full-Time"
        },
        "required_roles": [
            {
                "role_name": "Frontend Developer",
                "role_level": "Mid",
                "headcount": 2,
                "deployment_priority": "High"
            },
            {
                "role_name": "AI Engineer",
                "role_level": "Senior",
                "headcount": 1,
                "deployment_priority": "High"
            }
        ],
        "required_skills": [
            {
                "skill_name": "React",
                "required_level": "Intermediate",
                "mandatory": True
            },
            {
                "skill_name": "Node.js",
                "required_level": "Intermediate",
                "mandatory": True
            },
            {
                "skill_name": "Python",
                "required_level": "Advanced",
                "mandatory": True
            },
            {
                "skill_name": "GenAI",
                "required_level": "Advanced",
                "mandatory": False
            }
        ],
        "responsibilities": [
            "Develop AI scoring models",
            "Implement frontend dashboards",
            "Integrate REST APIs"
        ],
        "delivery_model": {
            "methodology": "Agile",
            "sprint_length_weeks": 2,
            "communication_mode": "Hybrid"
        },
        "deployment_readiness_criteria": {
            "minimum_skill_match_percentage": 60,
            "simulation_score_threshold": 70
        },
        "status": {
            "current_status": "Open",
            "deployment_stage": "Planning",
            "last_updated": "2024-02-01"
        }
    },
    {
        "project_id": "P002",
        "project_name": "Cloud Migration for E-Commerce",
        "project_type": "Client Project",
        "business_unit": "Enterprise Solutions",
        "domain": "Cloud & DevOps",
        "project_overview": {
            "objective": "Migrate legacy systems to AWS cloud.",
            "problem_statement": "On-prem infrastructure is costly and unscalable.",
            "expected_outcomes": [
                "Reduced infrastructure cost",
                "Improved scalability",
                "Zero downtime deployment"
            ]
        },
        "project_duration": {
            "start_date": "2024-03-01",
            "expected_end_date": "2024-09-30",
            "engagement_type": "Contract"
        },
        "required_roles": [
            {
                "role_name": "DevOps Engineer",
                "role_level": "Senior",
                "headcount": 2,
                "deployment_priority": "High"
            },
            {
                "role_name": "Backend Developer",
                "role_level": "Mid",
                "headcount": 1,
                "deployment_priority": "Medium"
            }
        ],
        "required_skills": [
            {
                "skill_name": "AWS",
                "required_level": "Advanced",
                "mandatory": True
            },
            {
                "skill_name": "Docker",
                "required_level": "Intermediate",
                "mandatory": True
            },
            {
                "skill_name": "Java",
                "required_level": "Intermediate",
                "mandatory": False
            },
            {
                "skill_name": "Spring Boot",
                "required_level": "Intermediate",
                "mandatory": False
            }
        ],
        "responsibilities": [
            "Setup CI/CD pipelines",
            "Containerize applications",
            "Deploy scalable infrastructure"
        ],
        "delivery_model": {
            "methodology": "Scrum",
            "sprint_length_weeks": 2,
            "communication_mode": "Remote"
        },
        "deployment_readiness_criteria": {
            "minimum_skill_match_percentage": 70,
            "simulation_score_threshold": 75
        },
        "status": {
            "current_status": "Open",
            "deployment_stage": "Execution",
            "last_updated": "2024-02-10"
        }
    },
    {
        "project_id": "P003",
        "project_name": "Data Analytics Dashboard",
        "project_type": "Internal Tooling",
        "business_unit": "Analytics",
        "domain": "Data Engineering",
        "project_overview": {
            "objective": "Create BI dashboards for executive insights.",
            "problem_statement": "Lack of centralized reporting.",
            "expected_outcomes": [
                "Real-time dashboards",
                "Automated reporting",
                "Improved decision making"
            ]
        },
        "project_duration": {
            "start_date": "2024-04-01",
            "expected_end_date": "2024-08-01",
            "engagement_type": "Full-Time"
        },
        "required_roles": [
            {
                "role_name": "Data Engineer",
                "role_level": "Mid",
                "headcount": 1,
                "deployment_priority": "High"
            },
            {
                "role_name": "Frontend Developer",
                "role_level": "Junior",
                "headcount": 1,
                "deployment_priority": "Low"
            }
        ],
        "required_skills": [
            {
                "skill_name": "Python",
                "required_level": "Intermediate",
                "mandatory": True
            },
            {
                "skill_name": "SQL",
                "required_level": "Advanced",
                "mandatory": True
            },
            {
                "skill_name": "Power BI",
                "required_level": "Intermediate",
                "mandatory": False
            }
        ],
        "responsibilities": [
            "Build ETL data pipelines",
            "Design dashboards in Power BI",
            "Maintain SQL queries and data marts"
        ],
        "delivery_model": {
            "methodology": "Kanban",
            "sprint_length_weeks": 1,
            "communication_mode": "Hybrid"
        },
        "deployment_readiness_criteria": {
            "minimum_skill_match_percentage": 65,
            "simulation_score_threshold": 70
        },
        "status": {
            "current_status": "Open",
            "deployment_stage": "Initiation",
            "last_updated": "2024-02-15"
        }
    }
]

DEFAULT_PROFILES = [
    {
        "employee_id": "E001",
        "email": "rahul@aionboarding.com",
        "name": "Rahul Shah",
        "current_role_summary": "Software developer working on full stack web applications and GenAI integration.",
        "desired_role_summary": "Backend and AI focused role designing scalable APIs and AI pipelines.",
        "experience_summary": "2 years experience in full development lifecycle from requirements to deployment.",
        "years_of_experience": 2.0,
        "extracted_skills": ["Python", "Java", "FastAPI", "SQL", "ML", "AI", "PyTorch", "REST API", "Git"],
        "merged_skills": ["React", "Node.js", "GenAI", "REST API", "Git", "Python", "Java", "FastAPI", "SQL", "ML", "AI", "PyTorch"],
        "soft_skills": {
            "communication": 3.58,
            "collaboration": 4.03,
            "problem_solving": 4.89,
            "ownership": 3.48
        },
        "learning_interests": [
            "Improve system design skills and learn cloud-native and AI-driven applications."
        ],
        "overall_score": 4.08,
        "readiness": "Moderate",
        "experience": 2.0
    }
]
