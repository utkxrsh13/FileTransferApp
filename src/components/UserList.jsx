import React from 'react';
import { motion } from 'framer-motion';
import { FiUser, FiSend } from 'react-icons/fi';

const UserList = ({ users, onSelectUser, selectedUser, hasFileSelected }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
        <FiUser className="mr-2" />
        Online Users ({users.length})
      </h3>
      
      {users.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400 text-4xl mb-2">👥</div>
          <p className="text-gray-600 dark:text-gray-400">
            No other users online
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {users.map((user) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`
                flex items-center justify-between p-3 rounded-lg border transition-all duration-200 cursor-pointer
                ${selectedUser?.id === user.id 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }
              `}
              onClick={() => onSelectUser(user)}
            >
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {user.username}
                  </h4>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    Online
                  </p>
                </div>
              </div>
              
              {selectedUser?.id === user.id && hasFileSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="flex items-center text-blue-600 dark:text-blue-400"
                >
                  <FiSend className="w-4 h-4 mr-1" />
                  <span className="text-sm font-medium">Selected</span>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserList;
