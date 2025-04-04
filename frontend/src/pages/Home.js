import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { FaShieldAlt, FaUsersCog, FaTasks, FaClipboardCheck, 
         FaChartLine, FaBell, FaEnvelope, FaUserTie, FaArrowRight, FaUsers, FaLock, FaSearch, FaCheckCircle } from 'react-icons/fa';
import { MdSecurity, MdCategory, MdDashboard, MdMenu, MdClose, MdVerified } from 'react-icons/md';
import '../styles/Home.css';

import dashboardGif from '../assets/dashboard.gif';
import analysisGif from '../assets/analysis.gif';
import securityGif from '../assets/security.gif';
import complianceGif from '../assets/compliance.gif';
import workflowGif from '../assets/workflow.gif';
import riskmanagementGif from '../assets/risk_management_check.gif';



import compliancemp4 from '../assets/compliance.mp4';
import riskmp4 from '../assets/risk.mp4';

import activityimg from '../assets/activity_monitering.jpg';
import complianceimg from '../assets/compliance_tracking.jpeg';
import dashboardimg from '../assets/dashboard_analytics.jpeg';
// import workflowimg from '../assets/workflow.png';
import regulationimg from '../assets/regulations.jpeg';
import riskimg from '../assets/risk_management.jpeg';
// import securityimg from '../assets/security.pn';
import taskimg from '../assets/task_management.jpeg';
import workflowimg from '../assets/wrokflow_automation.jpeg';

// Import animated GIFs
const gifs = {
  dashboard: dashboardGif,
  analysis: analysisGif,
  security: securityGif,
  compliance: complianceGif,
  workflow: workflowGif
};

// Import static images
const complianceImage = compliancemp4;
const riskManagementImage = riskmp4;
const workflowImage = "https://img.freepik.com/free-vector/gradient-infographic-steps-template_23-2149165238.jpg";

const Home = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentGifIndex, setCurrentGifIndex] = useState(0);
  const { scrollYProgress } = useScroll();
  const navigate = useNavigate();
  
  const headerOpacity = useTransform(scrollYProgress, [0, 0.1], [1, 1]);
  const headerY = useTransform(scrollYProgress, [0, 0.1], [0, 0]);

  // Array of GIFs
  const gifArray = [
    dashboardGif,
    analysisGif,
    securityGif,
    complianceGif,
    workflowGif
  ];

  useEffect(() => {
    document.title = 'RCMS - Risk Compliance Management System';
    
    // Automatic GIF carousel
    const interval = setInterval(() => {
      setCurrentGifIndex((prevIndex) => (prevIndex + 1) % gifArray.length);
    }, 3000); // Change GIF every 3 seconds

    return () => clearInterval(interval);
  }, []);

  // Enhanced Navbar
  const navItems = [
    { label: 'Features', href: '#features' },
    { label: 'Solutions', href: '#solutions' },
    { label: 'How it Works', href: '#how-it-works' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'Contact', href: '#contact' }
  ];

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
  };

  const slideIn = {
    hidden: { opacity: 0, x: -50 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: "easeOut" } }
  };

  const scaleIn = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.8, ease: "easeOut" } }
  };

  const heroPatterns = {
    initial: { pathLength: 0, opacity: 0 },
    animate: {
      pathLength: 1,
      opacity: 0.8,
      transition: { duration: 4, ease: "easeInOut" }
    }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3,
        delayChildren: 0.2
      }
    }
  };

  const features = [
    {
      icon: <FaShieldAlt size={40} />,
      title: 'Risk Management',
      description: 'Identify, assess, and mitigate risks effectively with our comprehensive risk management tools.',
      image: riskimg
    },
    {
      icon: <MdSecurity size={40} />,
      title: 'Compliance Tracking',
      description: 'Stay compliant with regulations and standards through automated tracking and reporting.',
      image: complianceimg
    },
    {
      icon: <FaUsersCog size={40} />,
      title: 'User Management',
      description: 'Manage global admins, entity admins, and regular users with role-based access control.',
      image: "https://img.freepik.com/free-vector/team-management-concept-illustration_114360-1908.jpg"
    },
    {
      icon: <MdCategory size={40} />,
      title: 'Categories & Regulations',
      description: 'Organize compliance requirements efficiently with customizable categories and regulation frameworks.',
      image: regulationimg
    },
    {
      icon: <FaTasks size={40} />,
      title: 'Task Assignment',
      description: 'Assign tasks to employees and track progress with deadline notifications and reminders.',
      image: taskimg
    },
    {
      icon: <FaClipboardCheck size={40} />,
      title: 'Activity Monitoring',
      description: 'Track activities and ensure completion with real-time monitoring and status updates.',
      image: activityimg
    },
    {
      icon: <FaEnvelope size={40} />,
      title: 'Workflow Automation',
      description: 'Automate email notifications and reminders to streamline compliance processes.',
      image: workflowimg
    },
    {
      icon: <FaChartLine size={40} />,
      title: 'Real-time Analytics',
      description: 'Analyze user efficiency and compliance status with interactive dashboards and reports.',
      image: dashboardimg
    }
  ];

  // Function to handle "Get Started" button click
  const handleGetStarted = () => {
    const userData = sessionStorage.getItem('user');
    
    if (!userData) {
      // Not logged in, redirect to login
      navigate('/login');
      return;
    }
    
    const user = JSON.parse(userData);
    
    // Redirect based on user role
    if (user.role === 'User') {
      navigate('/user-tasks');
    } else {
      // Admin, Global and other roles
      navigate('/tasks');
    }
  };

  return (
    <div className="home-container">
      {/* Enhanced Professional Fixed Header */}
      <motion.header 
        className="fixed-header"
        style={{ opacity: headerOpacity, y: headerY }}
      >
        <div className="header-container">
          <div className="header-logo">
            <MdDashboard className="logo-icon" />
            <span>RCMS</span>
          </div>
          
          <nav className="header-nav">
            {/* <ul>
              {navItems.map((item, index) => (
                <motion.li 
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <a href={item.href}>
                    {item.label}
                    <motion.div 
                      className="nav-item-underline"
                      layoutId="underline"
                    />
                  </a>
                </motion.li>
              ))}
            </ul> */}
          </nav>

          <div className="header-actions">
            <motion.button 
              className="login-btn"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link to="/login" style={{ color: 'inherit', textDecoration: 'none' }}>Log In</Link>
            </motion.button>
            <motion.button 
              className="get-started-btn"
              whileHover={{ 
                scale: 1.05,
                boxShadow: "0 20px 30px rgba(0, 98, 255, 0.3)"
              }}
              whileTap={{ scale: 0.95 }}
              onClick={handleGetStarted}
            >
              <span style={{ color: 'inherit', textDecoration: 'none' }}>
                Get Started
                <FaArrowRight className="btn-icon" />
              </span>
            </motion.button>
          </div>

          <button 
            className="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <MdClose size={24} /> : <MdMenu size={24} />}
          </button>
        </div>
        
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              className="mobile-menu"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <ul>
                {navItems.map((item, index) => (
                  <motion.li 
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <a href={item.href} onClick={() => setMobileMenuOpen(false)}>
                      {item.label}
                    </a>
                  </motion.li>
                ))}
                <motion.li 
                  className="mobile-cta"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: navItems.length * 0.1 }}
                >
                  <a href="/login" onClick={() => setMobileMenuOpen(false)}>Log In</a>
                </motion.li>
                <motion.li 
                  className="mobile-cta"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: (navItems.length + 1) * 0.1 }}
                >
                  <a href="/register" onClick={() => setMobileMenuOpen(false)}>Get Started</a>
                </motion.li>
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* Modified Hero Section with GIF Carousel */}
      <section className="hero-section" id="home">
        <div className="hero-background">
          <motion.div className="hero-particles">
            {Array.from({ length: 50 }).map((_, index) => (
              <motion.div
                key={index}
                className="particle"
                animate={{
                  y: [0, -100],
                  opacity: [0, 1, 0],
                  scale: [1, 1.5, 1]
                }}
                transition={{
                  duration: Math.random() * 3 + 2,
                  repeat: Infinity,
                  ease: "linear",
                  delay: Math.random() * 2
                }}
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`
                }}
              />
            ))}
          </motion.div>
          <motion.div 
            className="hero-gradient"
            animate={{
              background: [
                'radial-gradient(circle at 30% 50%, rgba(0, 98, 255, 0.15), transparent 70%)',
                'radial-gradient(circle at 70% 50%, rgba(0, 163, 215, 0.15), transparent 70%)',
                'radial-gradient(circle at 30% 50%, rgba(0, 98, 255, 0.15), transparent 70%)'
              ]
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          />
          <div className="hero-grid" />
        </div>

        <div className="hero-content-wrapper">
          <motion.div 
            className="hero-content"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <motion.div 
              className="hero-badge-container"
              variants={fadeIn}
              custom={0}
            >
              <motion.div
                className="hero-badge"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <motion.div
                  className="badge-icon"
                  animate={{
                    rotate: [0, 360],
                    scale: [1, 1.2, 1]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <FaShieldAlt size={20} />
                </motion.div>
                <motion.div 
                  className="badge-text"
                  animate={{
                    color: ['#ffffff', '#e0e7ff', '#ffffff']
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  Enterprise-Grade Security
                </motion.div>
                <motion.div 
                  className="badge-shine"
                  animate={{
                    x: ['-100%', '100%']
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    repeatDelay: 3
                  }}
                />
              </motion.div>
            </motion.div>

            <motion.h1 
              className="hero-title"
              variants={slideIn}
              custom={1}
            >
              <motion.span 
                className="gradient-text"
                animate={{
                  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "linear"
                }}
              >
                Risk Compliance
              </motion.span>
              <br />
              <motion.span
                className="management-text"
                animate={{
                  color: ['#ffffff', '#e0e7ff', '#ffffff']
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                Management System
              </motion.span>
            </motion.h1>

            <motion.p 
              className="hero-description"
              variants={fadeIn}
              custom={2}
            >
              Transform your compliance processes with our comprehensive platform designed for modern enterprises
            </motion.p>

            <motion.div 
              className="hero-features"
              variants={staggerContainer}
              custom={3}
            >
              {[
                { 
                  icon: <FaShieldAlt />, 
                  text: "Risk Assessment",
                  color: "#0062ff"
                },
                { 
                  icon: <MdSecurity />, 
                  text: "Compliance Tracking",
                  color: "#00a3d7"
                },
                { 
                  icon: <FaChartLine />, 
                  text: "Real-time Analytics",
                  color: "#7c3aed"
                },
                { 
                  icon: <MdVerified />, 
                  text: "Automated Audits",
                  color: "#06b6d4"
                }
              ].map((feature, index) => (
                <motion.div 
                  key={index}
                  className="hero-feature"
                  variants={fadeIn}
                  whileHover={{
                    scale: 1.05,
                    backgroundColor: 'rgba(255,255,255,0.1)'
                  }}
                  style={{
                    borderColor: feature.color
                    
                  }}
                >
                  <motion.div 
                    className="feature-icon"
                    animate={{
                      scale: [1, 1.2, 1],
                      rotate: [0, 10, -10, 0]
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: index * 0.2
                    }}
                    style={{
                      color: feature.color,
                      backgroundColor: `${feature.color}20`
                    }}
                  >
                    {feature.icon}
                  </motion.div>
                  <span>{feature.text}</span>
                  <motion.div 
                    className="feature-shine"
                    animate={{
                      x: ['-100%', '100%']
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      repeatDelay: 3,
                      delay: index * 0.2
                    }}
                  />
                </motion.div>
              ))}
            </motion.div>

            <motion.div 
              className="hero-cta"
              variants={fadeIn}
              custom={4}
            >
              <motion.button 
                className="primary-btn"
                whileHover={{ 
                  scale: 1.05,
                  boxShadow: "0 20px 30px rgba(0, 98, 255, 0.3)"
                }}
                whileTap={{ scale: 0.95 }}
                onClick={handleGetStarted}
              >
                <span>Get Started</span>
                <motion.div
                  animate={{
                    x: [0, 5, 0]
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <FaArrowRight />
                </motion.div>
                <motion.div className="btn-shine" />
              </motion.button>

              <motion.button 
                className="secondary-btn"
                whileHover={{ 
                  scale: 1.05,
                  backgroundColor: "rgba(255,255,255,0.15)"
                }}
                whileTap={{ scale: 0.95 }}
              >
                <span>Watch Demo</span>
                <motion.div className="btn-shine" />
              </motion.button>
            </motion.div>
          </motion.div>

          <motion.div 
            className="hero-showcase"
            variants={scaleIn}
            initial="hidden"
            animate="visible"
          >
            <motion.div 
              className="showcase-container"
              animate={{
                y: [-10, 10, -10],
                rotate: [-1, 1, -1]
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <motion.div 
                className="gif-carousel"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                {gifArray.map((gif, index) => (
                  <motion.img
                    key={index}
                    src={gif}
                    alt={`Feature ${index + 1}`}
                    className={`carousel-gif ${index === currentGifIndex ? 'active' : ''}`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ 
                      opacity: index === currentGifIndex ? 1 : 0,
                      scale: index === currentGifIndex ? 1 : 0.8,
                      zIndex: index === currentGifIndex ? 1 : 0
                    }}
                    transition={{ duration: 0.5 }}
                  />
                ))}
              </motion.div>
              <motion.div 
                className="showcase-overlay"
                animate={{
                  opacity: [0.3, 0.5, 0.3],
                  background: [
                    'linear-gradient(135deg, rgba(0,98,255,0.3) 0%, rgba(0,163,215,0.3) 100%)',
                    'linear-gradient(135deg, rgba(0,163,215,0.3) 0%, rgba(0,98,255,0.3) 100%)',
                    'linear-gradient(135deg, rgba(0,98,255,0.3) 0%, rgba(0,163,215,0.3) 100%)'
                  ]
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "linear"
                }}
              />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Enhanced Stats Section with Professional Cards */}
      <motion.section 
        className="stats-section"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <div className="stats-background">
          <motion.div 
            className="stats-gradient"
            animate={{
              background: [
                'radial-gradient(circle at 30% 50%, rgba(0, 98, 255, 0.1), transparent 50%)',
                'radial-gradient(circle at 70% 50%, rgba(0, 163, 215, 0.1), transparent 50%)',
                'radial-gradient(circle at 30% 50%, rgba(0, 98, 255, 0.1), transparent 50%)'
              ]
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          />
          <div className="stats-grid-pattern" />
        </div>

        <div className="stats-content">
          <motion.h2 
            className="stats-title"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            Trusted by Industry Leaders
          </motion.h2>
          <motion.p 
            className="stats-subtitle"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Delivering exceptional results across organizations
          </motion.p>

          <motion.div 
            className="stats-grid"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {[
              {
                icon: <FaShieldAlt />,
                value: "98%",
                label: "Compliance Rate",
                description: "Industry-leading compliance success rate",
                color: "#0062ff",
                image: "https://cdn.dribbble.com/users/1626229/screenshots/8775014/media/e83b3b0522dd19369f743d5f5815b96f.jpg"
              },
              {
                icon: <FaUsers />,
                value: "500+",
                label: "Organizations",
                description: "Global enterprises trust our platform",
                color: "#00a3d7",
                image: "https://cdn.dribbble.com/users/1626229/screenshots/8775014/media/e83b3b0522dd19369f743d5f5815b96f.jpg"
              },
              {
                icon: <FaChartLine />,
                value: "30%",
                label: "Efficiency Boost",
                description: "Average improvement in processes",
                color: "#7c3aed",
                image: "https://cdn.dribbble.com/users/1626229/screenshots/8775014/media/e83b3b0522dd19369f743d5f5815b96f.jpg"
              },
              {
                icon: <FaBell />,
                value: "24/7",
                label: "Support",
                description: "Round-the-clock expert assistance",
                color: "#f59e0b",
                image: "https://cdn.dribbble.com/users/1626229/screenshots/8775014/media/e83b3b0522dd19369f743d5f5815b96f.jpg"
              }
            ].map((stat, index) => (
              <motion.div 
                key={index}
                className="stat-card"
                variants={fadeIn}
                custom={index}
                whileHover={{ 
                  y: -10,
                  transition: { duration: 0.3 }
                }}
              >
                <div className="stat-card-inner">
                  <div className="stat-header" style={{ background: `linear-gradient(135deg, ${stat.color}, ${stat.color}dd)` }}>
                    <motion.div 
                      className="stat-icon"
                      animate={{
                        scale: [1, 1.2, 1],
                        rotate: [0, 10, -10, 0]
                      }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: index * 0.2
                      }}
                    >
                      {stat.icon}
                    </motion.div>
                    <motion.div 
                      className="stat-value"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2 + index * 0.1 }}
                    >
                      {stat.value}
                    </motion.div>
                  </div>
                  
                  <div className="stat-content">
                    <h3>{stat.label}</h3>
                    <p>{stat.description}</p>
                    
                    <motion.div 
                      className="stat-progress-bar"
                      initial={{ width: 0 }}
                      whileInView={{ width: "100%" }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.5, delay: 0.5 + index * 0.2 }}
                      style={{ background: stat.color }}
                    />
                  </div>

                  <motion.div 
                    className="stat-background-pattern"
                    animate={{
                      backgroundPosition: ['0% 0%', '100% 100%'],
                      opacity: [0.05, 0.1, 0.05]
                    }}
                    transition={{
                      duration: 10,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                  />
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* Enhanced Features Section with Impressive Animations */}
      <section className="features-section">
        <div className="features-bg-elements">
          <div className="bg-circle circle-1"></div>
          <div className="bg-circle circle-2"></div>
          <div className="bg-circle circle-3"></div>
          <div className="bg-line line-1"></div>
          <div className="bg-line line-2"></div>
        </div>
        
        <motion.div
          className="section-header"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <h2>
            <span className="highlight-text">Powerful</span> Features
          </h2>
          <p className="section-subtitle">Comprehensive tools to manage your compliance and risk requirements</p>
        </motion.div>
        
        <div className="features-container">
          <motion.div 
            className="features-grid"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
          >
            {features.map((feature, index) => (
              <motion.div 
                key={index} 
                className="feature-card"
                variants={fadeIn}
                whileHover={{ 
                  y: -15, 
                  transition: { duration: 0.3 } 
                }}
              >
                <div className="feature-image-container">
                  <img src={feature.image} alt={feature.title} className="feature-image" />
                  <div className="feature-image-glow"></div>
                  <div className="feature-icon-overlay">{feature.icon}</div>
                </div>
                <div className="feature-content">
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                  <motion.div 
                    className="feature-details-btn"
                    whileHover={{ 
                      scale: 1.05,
                      transition: { duration: 0.2 }
                    }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span>Learn More</span>
                    <FaArrowRight size={14} />
                  </motion.div>
                </div>
                <div className="feature-card-shine"></div>
              </motion.div>
            ))}
          </motion.div>
        </div>
        
        <motion.div 
          className="features-cta"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.5 }}
        >
          <div className="features-cta-content">
            <h3>Ready to explore all features?</h3>
            <p>Discover how our comprehensive suite of tools can transform your compliance management</p>
          </div>
          <motion.button 
            className="features-cta-btn"
            whileHover={{ 
              scale: 1.05,
              boxShadow: "0 15px 30px -10px rgba(79, 70, 229, 0.5)",
              transition: { duration: 0.2 }
            }}
            whileTap={{ scale: 0.95 }}
          >
            <span>View All Features</span>
            <FaArrowRight />
          </motion.button>
        </motion.div>
      </section>

      {/* How It Works Section - Enhanced */}
      <section className="how-it-works">
        <div className="section-header">
          <h2>How RCMS Works</h2>
          <p className="section-subtitle">A streamlined approach to compliance management</p>
        </div>
        
        <div className="workflow-container">
          <motion.div 
            className="workflow-image"
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <div className="workflow-image-wrapper">
              <img src={workflowImage} alt="RCMS Workflow" />
              <div className="workflow-image-overlay">
                <div className="pulse-circle"></div>
              </div>
            </div>
          </motion.div>
          
          <div className="workflow-steps">
            <motion.div 
              className="workflow-step"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div className="step-number-container">
                <div className="step-number">1</div>
                <div className="step-connector"></div>
              </div>
              <div className="step-content">
                <h3>Define Requirements</h3>
                <p>Set up categories and regulations specific to your organization's compliance needs</p>
                <div className="step-icon">
                  <MdCategory size={24} />
                </div>
              </div>
            </motion.div>
            
            <motion.div 
              className="workflow-step"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="step-number-container">
                <div className="step-number">2</div>
                <div className="step-connector"></div>
              </div>
              <div className="step-content">
                <h3>Assign Tasks</h3>
                <p>Delegate compliance tasks to appropriate team members with clear deadlines</p>
                <div className="step-icon">
                  <FaTasks size={24} />
                </div>
              </div>
            </motion.div>
            
            <motion.div 
              className="workflow-step"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <div className="step-number-container">
                <div className="step-number">3</div>
                <div className="step-connector"></div>
              </div>
              <div className="step-content">
                <h3>Monitor Progress</h3>
                <p>Track task completion and compliance status in real-time with automated alerts</p>
                <div className="step-icon">
                  <FaClipboardCheck size={24} />
                </div>
              </div>
            </motion.div>
            
            <motion.div 
              className="workflow-step"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <div className="step-number-container">
                <div className="step-number">4</div>
              </div>
              <div className="step-content">
                <h3>Analyze & Improve</h3>
                <p>Leverage analytics to enhance compliance processes and identify improvement areas</p>
                <div className="step-icon">
                  <FaChartLine size={24} />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Showcase Section - Enhanced */}
      <section className="showcase-section">
        <div className="section-header">
          <h2>Powerful Solutions</h2>
          <p className="section-subtitle">Comprehensive tools to transform your compliance management</p>
        </div>
        
        <motion.div 
          className="showcase-item"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <div className="showcase-content">
            <div className="showcase-badge">Risk Management</div>
            <h2>Comprehensive Risk Assessment</h2>
            <p>Our platform provides a holistic approach to risk management, allowing you to identify, assess, and mitigate risks effectively across your organization.</p>
            <ul className="showcase-features">
              <motion.li 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1, duration: 0.5 }}
              >
                <span className="feature-bullet"></span>
                Risk identification and assessment tools
              </motion.li>
              <motion.li 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                <span className="feature-bullet"></span>
                Customizable risk matrices and heat maps
              </motion.li>
              <motion.li 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                <span className="feature-bullet"></span>
                Automated risk monitoring and alerts
              </motion.li>
              <motion.li 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                <span className="feature-bullet"></span>
                Historical risk data analysis
              </motion.li>
            </ul>
            <button className="showcase-btn">
              <span>Learn More</span>
              <FaArrowRight />
            </button>
          </div>
          <motion.div 
            className="showcase-image"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
            whileHover={{ y: -10, transition: { duration: 0.3 } }}
          >
            <div className="image-card">
              <video src={riskManagementImage} autoPlay muted loop />
              <div className="image-overlay">
                <FaShieldAlt size={40} />
              </div>
            </div>
          </motion.div>
        </motion.div>
        
        <motion.div 
          className="showcase-item reverse"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <div className="showcase-content">
            <div className="showcase-badge">Compliance</div>
            <h2>Streamlined Compliance Management</h2>
            <p>Stay on top of regulatory requirements with our comprehensive compliance management tools designed to simplify complex compliance processes.</p>
            <ul className="showcase-features">
              <motion.li 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1, duration: 0.5 }}
              >
                <span className="feature-bullet"></span>
                Regulatory requirement tracking
              </motion.li>
              <motion.li 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                <span className="feature-bullet"></span>
                Compliance documentation management
              </motion.li>
              <motion.li 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                <span className="feature-bullet"></span>
                Automated compliance reporting
              </motion.li>
              <motion.li 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                <span className="feature-bullet"></span>
                Regulatory update notifications
              </motion.li>
            </ul>
            <button className="showcase-btn">
              <span>Learn More</span>
              <FaArrowRight />
            </button>
          </div>
          <motion.div 
            className="showcase-image"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
            whileHover={{ y: -10, transition: { duration: 0.3 } }}
          >
            <div className="image-card">
              <video src={complianceImage} autoPlay muted loop />
              <div className="image-overlay">
                <MdSecurity size={40} />
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Testimonial Section */}
      <section className="testimonial-section">
        <h2>Trusted by Compliance Professionals</h2>
        <p className="section-subtitle">See what our clients have to say about RCMS</p>
        
        <div className="testimonials-container">
          <motion.div 
            className="testimonial-card"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="testimonial-content">
              <div className="quote-mark">"</div>
              <p>The RCMS platform has transformed how we manage compliance across our organization. The automated workflows and real-time analytics have saved us countless hours and improved our compliance rate significantly.</p>
              <div className="testimonial-author">
                <div className="author-avatar">
                  <img src="https://randomuser.me/api/portraits/women/44.jpg" alt="Sarah Johnson" />
                </div>
                <div className="author-info">
                  <h4>Sarah Johnson</h4>
                  <p>Compliance Director, Global Financial Services</p>
                </div>
              </div>
            </div>
          </motion.div>
          
          <motion.div 
            className="testimonial-card"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="testimonial-content">
              <div className="quote-mark">"</div>
              <p>As a multinational corporation, managing compliance across different jurisdictions was a nightmare before RCMS. Now we have a centralized system that adapts to various regulatory frameworks while maintaining consistency.</p>
              <div className="testimonial-author">
                <div className="author-avatar">
                  <img src="https://randomuser.me/api/portraits/men/32.jpg" alt="Michael Chen" />
                </div>
                <div className="author-info">
                  <h4>Michael Chen</h4>
                  <p>Chief Risk Officer, Tech Innovations Inc.</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2>Ready to Transform Your Compliance Management?</h2>
          <p>Join hundreds of organizations that have streamlined their compliance processes with RCMS</p>
          <div className="cta-buttons">
            <motion.button 
              className="cta-primary-btn"
              onClick={handleGetStarted}
            >
              <span style={{ color: 'inherit', textDecoration: 'none' }}>Get Started Today</span>
            </motion.button>
            <button className="cta-secondary-btn">Schedule a Demo</button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <div className="footer-content">
          <div className="footer-logo">
            <h3>RCMS</h3>
            <p>Risk Compliance Management System</p>
            <div className="social-icons">
              <span className="social-icon"><i className="fab fa-linkedin"></i></span>
              <span className="social-icon"><i className="fab fa-twitter"></i></span>
              <span className="social-icon"><i className="fab fa-facebook"></i></span>
              <span className="social-icon"><i className="fab fa-instagram"></i></span>
            </div>
          </div>
          <div className="footer-links">
            <div className="link-group">
              <h4>Product</h4>
              <ul>
                <li>Features</li>
                <li>Pricing</li>
                <li>Integrations</li>
                <li>Updates</li>
              </ul>
            </div>
            <div className="link-group">
              <h4>Resources</h4>
              <ul>
                <li>Documentation</li>
                <li>Tutorials</li>
                <li>Webinars</li>
                <li>Blog</li>
              </ul>
            </div>
            <div className="link-group">
              <h4>Company</h4>
              <ul>
                <li>About Us</li>
                <li>Careers</li>
                <li>Contact</li>
                <li>Partners</li>
              </ul>
            </div>
            <div className="link-group">
              <h4>Legal</h4>
              <ul>
                <li>Privacy Policy</li>
                <li>Terms of Service</li>
                <li>Cookie Policy</li>
                <li>GDPR Compliance</li>
              </ul>
            </div>
          </div>
        </div>
        <div className="copyright">
          <p>© 2023 RCMS. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home; 