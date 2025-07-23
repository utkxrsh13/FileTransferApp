import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Login from '../components/Login';
import Register from '../components/Register';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);

  const toggleMode = () => {
    setIsLogin(!isLogin);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2">
            File Transfer App
          </h1>
          <p className="text-white/80">
            Secure and fast file sharing
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {isLogin ? (
            <Login key="login" onToggleMode={toggleMode} />
          ) : (
            <Register key="register" onToggleMode={toggleMode} />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AuthPage;
