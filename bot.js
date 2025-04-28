const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');
const schedule = require('node-schedule');
const axios = require('axios');

// Configuration
const CONFIG = {
  token: '7268248925:AAHmWrNJvOWIsq1SroDGX_Awro7pWDHWcuI',
  groupChatId: '-1002543988238',
  logFile: path.join(__dirname, 'bot_logs.txt'),
  dataDir: path.join(__dirname, 'data'),
  usersFile: path.join(__dirname, 'data', 'users.json'),
  settingsFile: path.join(__dirname, 'data', 'settings.json'),
  announcementsFile: path.join(__dirname, 'data', 'announcements.json'),
  statsFile: path.join(__dirname, 'data', 'stats.json'),
  backupInterval: '0 0 * * *', // Daily at midnight
};

// Ensure data directory exists
if (!fs.existsSync(CONFIG.dataDir)) {
  fs.mkdirSync(CONFIG.dataDir, { recursive: true });
}

// Role permissions (higher numbers include all lower permissions)
const PERMISSIONS = {
  owner: 100,
  'tech.admin': 90,
  director: 80,
  admin: 70,
  moderator: 50,
  premium: 20,
  user: 10,
  blocked: 0,
};

// Command permissions requirements
const COMMAND_PERMISSIONS = {
  '/test': 70,           // Admin or higher
  '/announce': 70,       // Admin or higher
  '/stats': 50,          // Moderator or higher
  '/adduser': 90,        // Tech.admin or higher
  '/removeuser': 90,     // Tech.admin or higher
  '/changerole': 90,     // Tech.admin or higher
  '/listusers': 70,      // Admin or higher
  '/broadcast': 80,      // Director or higher
  '/settings': 100,      // Owner only
  '/ban': 70,            // Admin or higher
  '/unban': 70,          // Admin or higher
  '/backup': 90,         // Tech.admin or higher
  '/restore': 100,       // Owner only
  '/schedule': 80,       // Director or higher
  '/cancel_schedule': 80,// Director or higher
  '/logs': 90,           // Tech.admin or higher
  '/help': 10,           // All registered users
  '/premium': 20,        // Premium users or higher
};

// Help texts for different permission levels
const HELP_TEXTS = {
    10: `📚 <b>Доступные команды</b>:
  • /start - Запустить бота
  • /help - Показать это справочное сообщение
  • /request <i>ваш запрос</i> - Отправить запрос администраторам`,
  
    20: `📚 <b>Премиум-команды</b>:
  • /premium - Доступ к премиум-функциям
  • /customstatus <i>ваш индивидуальный статус</i> - Установить индивидуальный статус`,
  
    50: `📚 <b>Команды модератора</b>:
  • /stats - Посмотреть статистику бота
  • /warn <i>@username</i> <i>причина</i> - Предупредить пользователя
  • /mute <i>@username</i> <i>продолжительность</i> <i>причина</i> - Предупредить пользователя
  • /unmute <i>@username</i> - Включить микрофон пользователя`,
  
  70: `📚 <b>Команды администратора</b>:
  • /test <i>твой текст</i> - Отправить сообщение группе
  • /announce <i>Ваше сообщение</i> - Сделать объявление
  • /listusers - Список всех зарегистрированных пользователей
  • /ban <i>@userId</i> <i>причина</i> - Заблокировать пользователя
  • /unban <i>@userId</i> - Разблокировать пользователя`,  
  
    80: `📚 <b>Director Commands</b>:
  • /broadcast <i>Ваше сообщение</i> - Отправить сообщение всем пользователям
  • /schedule <i>time</i> <i>command</i> - Запланировать команду
  • /cancel_schedule <i>id</i> - Отменить запланированную команду`,
  
    90: `📚 <b>Tech Admin Commands</b>:
  • /adduser <i>userId</i> <i>role</i> - Добавить нового пользователя
  • /removeuser <i>userId</i> - Удаление пользователя
  • /changerole <i>userId</i> <i>newRole</i> - Изменить роль пользователя
  • /backup - Создать резервную копию данных
  • /logs <i>lines</i> - Просмотр последних журналов`,
  
    100: `📚 <b>Команды владельца</b>:
  • /restore <i>filename</i> - Восстановление из резервной копии`,
  };  

// Initialize or load users data
let users = {
  '6924074231': { role: 'owner', name: 'Mark Travmatov', joinDate: new Date().toISOString() },
  '1234567890': { role: 'tech.admin', name: 'Svyatoslav Travmatov', joinDate: new Date().toISOString() },
  '342432': { role: 'admin', name: 'Administrator', joinDate: new Date().toISOString() },
  '3123': { role: 'director', name: 'Director FBI', joinDate: new Date().toISOString() }
};

// Load users if file exists
if (fs.existsSync(CONFIG.usersFile)) {
  try {
    users = JSON.parse(fs.readFileSync(CONFIG.usersFile, 'utf8'));
  } catch (error) {
    logError(`Не удалось загрузить пользователей.: ${error.message}`);
  }
} else {
  // Create initial users file
  saveUsers();
}

// Initialize or load settings
let settings = {
  welcomeMessage: 'Добро пожаловать в нашу систему!',
  notificationEnabled: true,
  maintenanceMode: false,
  maxWarnings: 3,
  muteDuration: 3600, // 1 hour in seconds
  language: 'ru',
  lastModified: new Date().toISOString()
};

// Load settings if file exists
if (fs.existsSync(CONFIG.settingsFile)) {
  try {
    settings = JSON.parse(fs.readFileSync(CONFIG.settingsFile, 'utf8'));
  } catch (error) {
    logError(`Не удалось загрузить настройки: ${error.message}`);
  }
} else {
  // Create initial settings file
  saveSettings();
}

// Initialize stats
let stats = {
  startDate: new Date().toISOString(),
  commandsProcessed: 0,
  activeUsers: 0,
  messagesSent: 0,
  errorCount: 0,
  lastReset: new Date().toISOString(),
};

// Load stats if file exists
if (fs.existsSync(CONFIG.statsFile)) {
  try {
    stats = JSON.parse(fs.readFileSync(CONFIG.statsFile, 'utf8'));
  } catch (error) {
    logError(`Не удалось загрузить статистику: ${error.message}`);
  }
} else {
  saveStats();
}

// Initialize scheduled announcements
let scheduledTasks = {};

// Create bot with polling
const bot = new TelegramBot(CONFIG.token, { polling: true });

// Save functions
function saveUsers() {
  try {
    fs.writeFileSync(CONFIG.usersFile, JSON.stringify(users, null, 2));
  } catch (error) {
    logError(`Не удалось сохранить пользователей.: ${error.message}`);
  }
}

function saveSettings() {
  try {
    settings.lastModified = new Date().toISOString();
    fs.writeFileSync(CONFIG.settingsFile, JSON.stringify(settings, null, 2));
  } catch (error) {
    logError(`Не удалось сохранить настройки.: ${error.message}`);
  }
}

function saveStats() {
  try {
    fs.writeFileSync(CONFIG.statsFile, JSON.stringify(stats, null, 2));
  } catch (error) {
    logError(`Не удалось сохранить статистику: ${error.message}`);
  }
}

// Logging functions
function logMessage(message) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ИНФОРМАЦИЯ: ${message}\n`;
  fs.appendFileSync(CONFIG.logFile, logEntry);
  console.log(`ИНФОРМАЦИЯ: ${message}`);
}

function logError(message) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ОШИБКА: ${message}\n`;
  fs.appendFileSync(CONFIG.logFile, logEntry);
  console.error(`ОШИБКА: ${message}`);
  stats.errorCount++;
  saveStats();
}

// Helper functions
function getUserRole(userId) {
  return users[userId] ? users[userId].role : 'guest';
}

function getUserPermissionLevel(userId) {
  const role = getUserRole(userId);
  return PERMISSIONS[role] || 0;
}

function canExecuteCommand(userId, command) {
  const userPermissionLevel = getUserPermissionLevel(userId);
  const requiredPermissionLevel = COMMAND_PERMISSIONS[command] || 0;
  return userPermissionLevel >= requiredPermissionLevel;
}

function getUserName(userId) {
  return users[userId] ? users[userId].name : 'Неизвестный';
}

function formatDate(date) {
  return new Date(date).toLocaleString('ru-RU');
}

function createBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(CONFIG.dataDir, 'backups');
  
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  const backupFile = path.join(backupDir, `backup_${timestamp}.json`);
  
  const backupData = {
    users,
    settings,
    stats,
    timestamp,
  };
  
  try {
    fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
    logMessage(`Backup created: ${backupFile}`);
    return backupFile;
  } catch (error) {
    logError(`Failed to create backup: ${error.message}`);
    return null;
  }
}

// Command handlers
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id.toString();
  const userRole = getUserRole(userId);

  // Update stats
  stats.activeUsers++;
  stats.commandsProcessed++;
  saveStats();

  // Log the start command
  logMessage(`User ${userId} (${getUserName(userId)}) started the bot`);

  // Check if maintenance mode is on for non-admins
  if (settings.maintenanceMode && getUserPermissionLevel(userId) < PERMISSIONS.admin) {
    bot.sendMessage(chatId, '🛠 Бот находится в режиме технического обслуживания. Пожалуйста, попробуйте позже.');
    return;
  }

  // Generate greeting based on user role
  let greeting;
  
  if (userRole === 'guest') {
    greeting = `${settings.welcomeMessage}\n\nУ вас нет зарегистрированной учетной записи. Свяжитесь с администратором для получения доступа.\n\nАдминистраторы:\n@sakurariley - tech.admin\n@JUMBO196 - tech.admin`;
    
    // Create a temporary user if they don't exist
    if (!users[userId]) {
      users[userId] = {
        role: 'guest',
        name: msg.from.username ? msg.from.username : `Guest_${userId.substring(0, 5)}`,
        joinDate: new Date().toISOString()
      };
      saveUsers();
    }
  } else {
    const permissionLevel = getUserPermissionLevel(userId);
    
    // Get help text for the user's permission level
    let helpText = '';
    Object.keys(HELP_TEXTS)
      .filter(level => level <= permissionLevel)
      .sort((a, b) => a - b)
      .forEach(level => {
        helpText += HELP_TEXTS[level] + '\n\n';
      });
    
    greeting = `👋 <b>Привет, ${getUserName(userId)}!</b>\n\n`;
    greeting += `🔑 Ваша роль: <b>${userRole}</b>\n`;
    greeting += `📆 Дата регистрации: ${formatDate(users[userId].joinDate)}\n\n`;
    greeting += `${helpText}`;
  }

  bot.sendMessage(chatId, greeting, { parse_mode: 'HTML' });
});

// Command to send messages to the group
bot.onText(/\/test (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id.toString();
  const messageToSend = match[1];

  // Update stats
  stats.commandsProcessed++;
  saveStats();
  
  // Check if user has permission to run this command
  if (!canExecuteCommand(userId, '/test')) {
    bot.sendMessage(chatId, '❌ У вас нет прав для выполнения этой команды.');
    return;
  }

  const userName = msg.from.username ? `@${msg.from.username}` : getUserName(userId);
  const userRole = getUserRole(userId);
  
  // Format message based on user role
  let roleEmoji;
  switch (userRole) {
    case 'owner':
      roleEmoji = '👑';
      break;
    case 'tech.admin':
      roleEmoji = '⚙️';
      break;
    case 'director':
      roleEmoji = '🔱';
      break;
    case 'admin':
      roleEmoji = '🛡️';
      break;
    default:
      roleEmoji = '📢';
  }

  const formattedMessage = `${roleEmoji} <b>Сообщение от ${userRole}</b> ${userName}\n\n${messageToSend}`;

  // Send message to the group
  bot.sendMessage(CONFIG.groupChatId, formattedMessage, { parse_mode: 'HTML' })
    .then(() => {
      bot.sendMessage(chatId, '✅ Сообщение успешно отправлено в группу!');
      stats.messagesSent++;
      saveStats();
      logMessage(`User ${userId} (${getUserName(userId)}) отправил сообщение в группу: ${messageToSend.substring(0, 50)}...`);
    })
    .catch(error => {
      bot.sendMessage(chatId, `❌ Ошибка при отправке сообщения: ${error.message}`);
      logError(`Не удалось отправить групповое сообщение от ${userId}: ${error.message}`);
    });
});

// Help command
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id.toString();
  const permissionLevel = getUserPermissionLevel(userId);
  
  // Update stats
  stats.commandsProcessed++;
  saveStats();
  
  // Get help text for the user's permission level
  let helpText = '';
  Object.keys(HELP_TEXTS)
    .filter(level => level <= permissionLevel)
    .sort((a, b) => a - b)
    .forEach(level => {
      helpText += HELP_TEXTS[level] + '\n\n';
    });
  
  bot.sendMessage(chatId, helpText, { parse_mode: 'HTML' });
});

// Request command for users to contact admins
bot.onText(/\/request (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id.toString();
  const requestText = match[1];
  
  // Update stats
  stats.commandsProcessed++;
  saveStats();
  
  // Send request to all admins
  Object.entries(users).forEach(([adminId, user]) => {
    if (getUserPermissionLevel(adminId) >= PERMISSIONS.admin) {
      const requestMessage = `📨 <b>Новый запрос от пользователя</b>\n\n` +
        `<b>От:</b> ${getUserName(userId)} (ID: ${userId})\n` +
        `<b>Текст:</b> ${requestText}\n\n` + 
        `Для ответа используйте команду:\n` +
        `/reply ${userId} Ваш ответ`;
      
      bot.sendMessage(adminId, requestMessage, { parse_mode: 'HTML' })
        .catch(() => logError(`Не удалось отправить запрос-уведомление администратору ${adminId}`));
    }
  });
  
  bot.sendMessage(chatId, '✅ Ваш запрос был отправлен администраторам. Ожидайте ответа.');
  logMessage(`User ${userId} отправил запрос: ${requestText.substring(0, 50)}...`);
});

// Reply to user requests
bot.onText(/\/reply (\d+) (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id.toString();
  const targetUserId = match[1];
  const replyText = match[2];
  
  // Update stats
  stats.commandsProcessed++;
  saveStats();
  
  // Check if user has permission to reply (admin or higher)
  if (getUserPermissionLevel(userId) < PERMISSIONS.admin) {
    bot.sendMessage(chatId, '❌ У вас нет прав для ответа на запросы.');
    return;
  }
  
  // Send reply to the user
  const replyMessage = `📩 <b>Ответ от администрации</b>\n\n` +
    `<b>От:</b> ${getUserName(userId)}\n` +
    `<b>Сообщение:</b> ${replyText}`;
  
  bot.sendMessage(targetUserId, replyMessage, { parse_mode: 'HTML' })
    .then(() => {
      bot.sendMessage(chatId, `✅ Ответ успешно отправлен пользователю ${getUserName(targetUserId)}.`);
      stats.messagesSent++;
      saveStats();
    })
    .catch(error => {
      bot.sendMessage(chatId, `❌ Ошибка при отправке ответа: ${error.message}`);
      logError(`Failed to send reply to ${targetUserId}: ${error.message}`);
    });
});

// Make announcements
bot.onText(/\/announce (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id.toString();
  const announcement = match[1];
  
  // Update stats
  stats.commandsProcessed++;
  saveStats();
  
  // Check if user has permission
  if (!canExecuteCommand(userId, '/announce')) {
    bot.sendMessage(chatId, '❌ У вас нет прав для создания объявлений.');
    return;
  }
  
  const userName = getUserName(userId);
  const announcementMessage = `📣 <b>ОБЪЯВЛЕНИЕ</b> 📣\n\n${announcement}\n\n<i>От: ${userName}</i>`;
  
  // Send to the group
  bot.sendMessage(CONFIG.groupChatId, announcementMessage, { 
    parse_mode: 'HTML',
    disable_notification: false
  })
    .then(() => {
      bot.sendMessage(chatId, '✅ Объявление успешно опубликовано!');
      stats.messagesSent++;
      saveStats();
      logMessage(`Пользователь ${userId} (${userName}) сделал объявление`);
    })
    .catch(error => {
      bot.sendMessage(chatId, `❌ Ошибка при публикации объявления: ${error.message}`);
      logError(`Не удалось отправить объявление от ${userId}: ${error.message}`);
    });
});

// User management commands
bot.onText(/\/adduser (\d+) (\w+) (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id.toString();
  const newUserId = match[1];
  const newUserRole = match[2];
  const newUserName = match[3];
  
  // Update stats
  stats.commandsProcessed++;
  saveStats();
  
  // Check if user has permission
  if (!canExecuteCommand(userId, '/adduser')) {
    bot.sendMessage(chatId, '❌ У вас нет прав для добавления пользователей.');
    return;
  }
  
  // Validate role
  if (!PERMISSIONS.hasOwnProperty(newUserRole)) {
    bot.sendMessage(chatId, `❌ Некорректная роль. Доступные роли: ${Object.keys(PERMISSIONS).join(', ')}`);
    return;
  }
  
  // Don't allow creating users with higher permission level than the creator
  if (PERMISSIONS[newUserRole] > getUserPermissionLevel(userId)) {
    bot.sendMessage(chatId, '❌ Вы не можете создать пользователя с ролью выше вашей.');
    return;
  }
  
  // Add the new user
  users[newUserId] = {
    role: newUserRole,
    name: newUserName,
    joinDate: new Date().toISOString(),
    addedBy: userId
  };
  
  saveUsers();
  bot.sendMessage(chatId, `✅ Пользователь ${newUserName} (ID: ${newUserId}) успешно добавлен с ролью ${newUserRole}.`);
  logMessage(`Пользователь ${userId} добавлен новый пользователь ${newUserId} с ролью ${newUserRole}`);
  
  // Notify the new user if possible
  try {
    bot.sendMessage(newUserId, `🎉 <b>Добро пожаловать!</b>\n\nВы были добавлены в систему администратором ${getUserName(userId)}.\nВаша роль: <b>${newUserRole}</b>\n\nВведите /start для начала работы.`, { parse_mode: 'HTML' })
      .catch(() => logMessage(`Не удалось уведомить нового пользователя ${newUserId} о регистрации`));
  } catch (error) {
    logError(`Не удалось уведомить нового пользователя ${newUserId}: ${error.message}`);
  }
});

bot.onText(/\/removeuser (\d+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id.toString();
  const targetUserId = match[1];
  
  // Update stats
  stats.commandsProcessed++;
  saveStats();
  
  // Check if user has permission
  if (!canExecuteCommand(userId, '/removeuser')) {
    bot.sendMessage(chatId, '❌ У вас нет прав для удаления пользователей.');
    return;
  }
  
  // Check if target user exists
  if (!users[targetUserId]) {
    bot.sendMessage(chatId, '❌ Пользователь с указанным ID не найден.');
    return;
  }
  
  // Can't remove users with higher permission level
  if (getUserPermissionLevel(targetUserId) > getUserPermissionLevel(userId)) {
    bot.sendMessage(chatId, '❌ Вы не можете удалить пользователя с ролью выше вашей.');
    return;
  }
  
  // Can't remove yourself
  if (targetUserId === userId) {
    bot.sendMessage(chatId, '❌ Вы не можете удалить свою учетную запись.');
    return;
  }
  
  const userName = getUserName(targetUserId);
  const userRole = users[targetUserId].role;
  
  // Remove the user
  delete users[targetUserId];
  saveUsers();
  
  bot.sendMessage(chatId, `✅ Пользователь ${userName} (ID: ${targetUserId}, роль: ${userRole}) успешно удален.`);
  logMessage(`Пользователь ${userId} удаленный пользователь ${targetUserId}`);
  
  // Notify the removed user
  try {
    bot.sendMessage(targetUserId, `⚠️ Ваша учетная запись была удалена администратором.`)
      .catch(() => {});
  } catch (error) {}
});

bot.onText(/\/changerole (\d+) (\w+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id.toString();
  const targetUserId = match[1];
  const newRole = match[2];
  
  // Update stats
  stats.commandsProcessed++;
  saveStats();
  
  // Check if user has permission
  if (!canExecuteCommand(userId, '/changerole')) {
    bot.sendMessage(chatId, '❌ У вас нет прав для изменения ролей.');
    return;
  }
  
  // Check if target user exists
  if (!users[targetUserId]) {
    bot.sendMessage(chatId, '❌ Пользователь с указанным ID не найден.');
    return;
  }
  
  // Validate role
  if (!PERMISSIONS.hasOwnProperty(newRole)) {
    bot.sendMessage(chatId, `❌ Некорректная роль. Доступные роли: ${Object.keys(PERMISSIONS).join(', ')}`);
    return;
  }
  
  // Can't change users with higher permission level
  if (getUserPermissionLevel(targetUserId) > getUserPermissionLevel(userId)) {
    bot.sendMessage(chatId, '❌ Вы не можете изменить роль пользователя с ролью выше вашей.');
    return;
  }
  
  // Can't assign a role higher than your own
  if (PERMISSIONS[newRole] > getUserPermissionLevel(userId)) {
    bot.sendMessage(chatId, '❌ Вы не можете назначить роль выше вашей.');
    return;
  }
  
  const userName = getUserName(targetUserId);
  const oldRole = users[targetUserId].role;
  
  // Change the role
  users[targetUserId].role = newRole;
  users[targetUserId].lastRoleChange = {
    date: new Date().toISOString(),
    changedBy: userId,
    previousRole: oldRole
  };
  
  saveUsers();
  
  bot.sendMessage(chatId, `✅ Роль пользователя ${userName} (ID: ${targetUserId}) изменена с ${oldRole} на ${newRole}.`);
  logMessage(`User ${userId} изменена роль пользователя ${targetUserId} от ${oldRole} к ${newRole}`);
  
  // Notify the user about role change
  try {
    bot.sendMessage(targetUserId, `🔄 <b>Изменение роли</b>\n\nВаша роль была изменена с <b>${oldRole}</b> на <b>${newRole}</b>.\n\nЕсли у вас есть вопросы, обратитесь к администрации.`, { parse_mode: 'HTML' })
      .catch(() => {});
  } catch (error) {}
});

bot.onText(/\/listusers/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id.toString();
  
  // Update stats
  stats.commandsProcessed++;
  saveStats();
  
  // Check if user has permission
  if (!canExecuteCommand(userId, '/listusers')) {
    bot.sendMessage(chatId, '❌ У вас нет прав для просмотра списка пользователей.');
    return;
  }
  
  // Generate user list grouped by role
  const usersByRole = {};
  
  Object.entries(users).forEach(([id, user]) => {
    if (!usersByRole[user.role]) {
      usersByRole[user.role] = [];
    }
    usersByRole[user.role].push({ id, name: user.name });
  });
  
  let userList = '👥 <b>Список пользователей по ролям:</b>\n\n';
  
  // Sort roles by permission level (highest first)
  const sortedRoles = Object.keys(usersByRole).sort((a, b) => PERMISSIONS[b] - PERMISSIONS[a]);
  
  sortedRoles.forEach(role => {
    const roleEmoji = role === 'owner' ? '👑' : 
                      role === 'tech.admin' ? '⚙️' : 
                      role === 'director' ? '🔱' : 
                      role === 'admin' ? '🛡️' : 
                      role === 'moderator' ? '🔍' : 
                      role === 'premium' ? '💎' : 
                      role === 'user' ? '👤' : '❓';
    
    userList += `${roleEmoji} <b>${role.toUpperCase()}</b> (${usersByRole[role].length}):\n`;
    
    usersByRole[role].forEach(user => {
      userList += `- ${user.name} (ID: ${user.id})\n`;
    });
    
    userList += '\n';
  });
  
  bot.sendMessage(chatId, userList, { parse_mode: 'HTML' });
});

// Broadcast message to all users
bot.onText(/\/broadcast (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id.toString();
  const broadcastMessage = match[1];
  
  // Update stats
  stats.commandsProcessed++;
  saveStats();
  
  // Check if user has permission
  if (!canExecuteCommand(userId, '/broadcast')) {
    bot.sendMessage(chatId, '❌ У вас нет прав для отправки массовых сообщений.');
    return;
  }
  
  const senderName = getUserName(userId);
  const formattedMessage = `📢 <b>ВАЖНОЕ ОБЪЯВЛЕНИЕ</b>\n\n${broadcastMessage}\n\n<i>От: ${senderName}</i>`;
  
  let sentCount = 0;
  let failedCount = 0;
  
  // Show "typing" status to indicate progress
  bot.sendChatAction(chatId, 'typing');
  
  // Send to all users
  const startTime = Date.now();
  const userIds = Object.keys(users);
  
  // Function to send messages sequentially to avoid hitting rate limits
  const sendMessages = async () => {
    for (const targetId of userIds) {
      try {
        if (targetId === userId) continue; // Skip sender
        
        await bot.sendMessage(targetId, formattedMessage, { parse_mode: 'HTML', disable_web_page_preview: true });
        sentCount++;
        stats.messagesSent++;
        
        // Small delay to avoid hitting rate limits
        await new Promise(resolve => setTimeout(resolve, 50));
      } catch (error) {
        failedCount++;
        logError(`Не удалось отправить трансляцию ${targetId}: ${error.message}`);
      }
    }
    
    const timeTaken = ((Date.now() - startTime) / 1000).toFixed(1);
    
    bot.sendMessage(chatId, `✅ Массовая рассылка завершена!\n\n` +
      `📊 <b>Статистика:</b>\n` +
      `- Отправлено успешно: ${sentCount} пользователям\n` +
      `- Ошибок доставки: ${failedCount}\n` +
      `- Время выполнения: ${timeTaken} секунд`,
      { parse_mode: 'HTML' });
    
    saveStats();
    logMessage(`Пользователь ${userId} отправил широковещательное сообщение на ${sentCount} пользователи (${failedCount} неуспешный)`);
  };
  
  sendMessages();
});

// Settings command
bot.onText(/\/settings/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id.toString();
  
  // Update stats
  stats.commandsProcessed++;
  saveStats();
  
  // Check if user has permission
  if (!canExecuteCommand(userId, '/settings')) {
    bot.sendMessage(chatId, '❌ У вас нет прав для изменения настроек бота.');
    return;
  }
  
  // Show current settings
  let settingsMessage = '⚙️ <b>Текущие настройки бота:</b>\n\n';
  settingsMessage += `- Приветственное сообщение: "${settings.welcomeMessage}"\n`;
  settingsMessage += `- Уведомления: ${settings.notificationEnabled ? '✅ Включены' : '❌ Отключены'}\n`;
  settingsMessage += `- Режим обслуживания: ${settings.maintenanceMode ? '✅ Включен' : '❌ Отключен'}\n`;
  settingsMessage += `- Макс. предупреждений: ${settings.maxWarnings}\n`;
  settingsMessage += `- Длительность мута: ${settings.muteDuration} секунд\n`;
  settingsMessage += `- Язык: ${settings.language}\n`;
  settingsMessage += `- Последнее изменение: ${formatDate(settings.lastModified)}\n\n`;
  
  settingsMessage += `Для изменения настроек используйте:\n`;
  settingsMessage += `/set_welcome <текст> - Изменить приветственное сообщение\n`;
  settingsMessage += `/toggle_notifications - Вкл/выкл уведомления\n`;
  settingsMessage += `/toggle_maintenance - Вкл/выкл режим обслуживания\n`;
  settingsMessage += `/set_max_warnings <число> - Установить макс. предупреждений\n`;
  settingsMessage += `/set_mute_duration <секунды> - Установить длительность мута\n`;
  settingsMessage += `/set_language <код> - Установить язык (ru, en)`;
  
  bot.sendMessage(chatId, settingsMessage, { parse_mode: 'HTML' });
});

// Settings modification commands
bot.onText(/\/set_welcome (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id.toString();
  const newWelcome = match[1];
  
  // Check if user has permission
  if (!canExecuteCommand(userId, '/settings')) {
    bot.sendMessage(chatId, '❌ У вас нет прав для изменения настроек бота.');
    return;
  }
  
  settings.welcomeMessage = newWelcome;
  saveSettings();
  
  bot.sendMessage(chatId, '✅ Приветственное сообщение успешно изменено.');
  logMessage(`Пользователь ${userId} изменено приветственное сообщение`);
});

bot.onText(/\/toggle_notifications/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id.toString();
  
  // Check if user has permission
  if (!canExecuteCommand(userId, '/settings')) {
    bot.sendMessage(chatId, '❌ У вас нет прав для изменения настроек бота.');
    return;
  }
  
  settings.notificationEnabled = !settings.notificationEnabled;
  saveSettings();
  
  bot.sendMessage(chatId, `✅ Уведомления ${settings.notificationEnabled ? 'включены' : 'отключены'}.`);
  logMessage(`Пользователь ${userId} ${settings.notificationEnabled ? 'включены' : 'отключены'} notifications`);
});

bot.onText(/\/toggle_maintenance/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id.toString();
  
  // Check if user has permission
  if (!canExecuteCommand(userId, '/settings')) {
    bot.sendMessage(chatId, '❌ У вас нет прав для изменения настроек бота.');
    return;
  }
  
  settings.maintenanceMode = !settings.maintenanceMode;
  saveSettings();
  
  bot.sendMessage(chatId, `✅ Режим обслуживания ${settings.maintenanceMode ? 'включен' : 'отключен'}.`);
  logMessage(`Пользователь ${userId} ${settings.maintenanceMode ? 'включен' : 'отключен'} режим обслуживания`);
  
  // Notify all users about maintenance mode
  if (settings.maintenanceMode && settings.notificationEnabled) {
    Object.keys(users).forEach(targetId => {
      if (getUserPermissionLevel(targetId) < PERMISSIONS.admin) {
        bot.sendMessage(targetId, '🛠 <b>Уведомление</b>\n\nБот перешел в режим технического обслуживания. Некоторые функции могут быть недоступны.', { parse_mode: 'HTML' })
          .catch(() => {});
      }
    });
  }
});

// User ban/unban commands
bot.onText(/\/ban (\d+) (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id.toString();
  const targetUserId = match[1];
  const reason = match[2];
  
  // Update stats
  stats.commandsProcessed++;
  saveStats();
  
  // Check if user has permission
  if (!canExecuteCommand(userId, '/ban')) {
    bot.sendMessage(chatId, '❌ У вас нет прав для блокировки пользователей.');
    return;
  }
  
  // Check if target user exists
  if (!users[targetUserId]) {
    bot.sendMessage(chatId, '❌ Пользователь с указанным ID не найден.');
    return;
  }
  
  // Can't ban users with higher permission level
  if (getUserPermissionLevel(targetUserId) > getUserPermissionLevel(userId)) {
    bot.sendMessage(chatId, '❌ Вы не можете заблокировать пользователя с ролью выше вашей.');
    return;
  }
  
  // Can't ban yourself
  if (targetUserId === userId) {
    bot.sendMessage(chatId, '❌ Вы не можете заблокировать свою учетную запись.');
    return;
  }
  
  const userName = getUserName(targetUserId);
  const prevRole = users[targetUserId].role;
  
  // Ban user by changing role to "blocked"
  users[targetUserId].role = 'blocked';
  users[targetUserId].bannedBy = {
    userId,
    date: new Date().toISOString(),
    reason,
    previousRole: prevRole
  };
  
  saveUsers();
  
  bot.sendMessage(chatId, `✅ Пользователь ${userName} (ID: ${targetUserId}) заблокирован.\nПричина: ${reason}`);
  logMessage(`User ${userId} banned user ${targetUserId} for reason: ${reason}`);
  
  // Notify the banned user
  try {
    bot.sendMessage(targetUserId, `🚫 <b>Вы были заблокированы</b>\n\nПричина: ${reason}\n\nЕсли вы считаете, что это ошибка, свяжитесь с администрацией.`, { parse_mode: 'HTML' })
      .catch(() => {});
  } catch (error) {}
});

bot.onText(/\/unban (\d+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id.toString();
  const targetUserId = match[1];
  
  // Update stats
  stats.commandsProcessed++;
  saveStats();
  
  // Check if user has permission
  if (!canExecuteCommand(userId, '/unban')) {
    bot.sendMessage(chatId, '❌ У вас нет прав для разблокировки пользователей.');
    return;
  }
  
  // Check if target user exists
  if (!users[targetUserId]) {
    bot.sendMessage(chatId, '❌ Пользователь с указанным ID не найден.');
    return;
  }
  
  // Check if user is actually blocked
  if (users[targetUserId].role !== 'blocked') {
    bot.sendMessage(chatId, '❌ Этот пользователь не заблокирован.');
    return;
  }
  
  const userName = getUserName(targetUserId);
  const prevRole = users[targetUserId].bannedBy?.previousRole || 'user';
  
  // Unban user by restoring previous role
  users[targetUserId].role = prevRole;
  users[targetUserId].unbannedBy = {
    userId,
    date: new Date().toISOString()
  };
  
  saveUsers();
  
  bot.sendMessage(chatId, `✅ Пользователь ${userName} (ID: ${targetUserId}) разблокирован и восстановлен с ролью ${prevRole}.`);
  logMessage(`User ${userId} unbanned user ${targetUserId}`);
  
  // Notify the unbanned user
  try {
    bot.sendMessage(targetUserId, `🔓 <b>Ваша блокировка снята</b>\n\nВаша учетная запись разблокирована. Ваша роль: ${prevRole}.\n\nВведите /start для обновления информации.`, { parse_mode: 'HTML' })
      .catch(() => {});
  } catch (error) {}
});

// Stats command
bot.onText(/\/stats/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id.toString();
  
  // Update stats
  stats.commandsProcessed++;
  saveStats();
  
  // Check if user has permission
  if (!canExecuteCommand(userId, '/stats')) {
    bot.sendMessage(chatId, '❌ У вас нет прав для просмотра статистики.');
    return;
  }
  
  // Calculate uptime
  const startDate = new Date(stats.startDate);
  const currentDate = new Date();
  const uptimeDays = Math.floor((currentDate - startDate) / (1000 * 60 * 60 * 24));
  
  let statsMessage = '📊 <b>Статистика бота:</b>\n\n';
  statsMessage += `📆 Дата запуска: ${formatDate(stats.startDate)}\n`;
  statsMessage += `⏱️ Время работы: ${uptimeDays} дней\n`;
  statsMessage += `🔢 Обработано команд: ${stats.commandsProcessed}\n`;
  statsMessage += `👥 Активных пользователей: ${stats.activeUsers}\n`;
  statsMessage += `💬 Отправлено сообщений: ${stats.messagesSent}\n`;
  statsMessage += `⚠️ Количество ошибок: ${stats.errorCount}\n`;
  statsMessage += `🔄 Последний сброс: ${formatDate(stats.lastReset)}\n\n`;
  
  // Count users by role
  const userCounts = {};
  Object.values(users).forEach(user => {
    userCounts[user.role] = (userCounts[user.role] || 0) + 1;
  });
  
  statsMessage += '👥 <b>Пользователи по ролям:</b>\n';
  
  Object.entries(userCounts)
    .sort((a, b) => PERMISSIONS[b[0]] - PERMISSIONS[a[0]])
    .forEach(([role, count]) => {
      statsMessage += `- ${role}: ${count}\n`;
    });
  
  bot.sendMessage(chatId, statsMessage, { parse_mode: 'HTML' });
});

// Backup command
bot.onText(/\/backup/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id.toString();
  
  // Update stats
  stats.commandsProcessed++;
  saveStats();
  
  // Check if user has permission
  if (!canExecuteCommand(userId, '/backup')) {
    bot.sendMessage(chatId, '❌ У вас нет прав для создания резервных копий.');
    return;
  }
  
  // Create backup
  const backupFile = createBackup();
  
  if (backupFile) {
    const backupName = path.basename(backupFile);
    bot.sendMessage(chatId, `✅ Резервная копия успешно создана: ${backupName}`);
    logMessage(`User ${userId} created backup ${backupName}`);
  } else {
    bot.sendMessage(chatId, '❌ Ошибка при создании резервной копии.');
  }
});

// View logs command
bot.onText(/\/logs(?:\s+(\d+))?/, (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id.toString();
  const lines = match[1] ? parseInt(match[1]) : 20; // Default to 20 lines
  
  // Update stats
  stats.commandsProcessed++;
  saveStats();
  
  // Check if user has permission
  if (!canExecuteCommand(userId, '/logs')) {
    bot.sendMessage(chatId, '❌ У вас нет прав для просмотра логов.');
    return;
  }
  
  // Check if log file exists
  if (!fs.existsSync(CONFIG.logFile)) {
    bot.sendMessage(chatId, '❌ Файл логов не найден.');
    return;
  }
  
  try {
    // Read the last N lines of the log file
    const data = fs.readFileSync(CONFIG.logFile, 'utf8');
    const logLines = data.split('\n').filter(line => line.trim() !== '');
    const lastLogs = logLines.slice(-Math.min(lines, 100)); // Get up to the requested lines, max 100
    
    let logMessage = `📋 <b>Последние ${lastLogs.length} записей лога:</b>\n\n`;
    
    lastLogs.forEach(line => {
      // Format log entries for better readability
      const match = line.match(/\[(.+?)\] (INFO|ERROR): (.+)/);
      
      if (match) {
        const timestamp = match[1];
        const logType = match[2];
        const message = match[3];
        
        const formattedTime = timestamp.split('T')[1].split('.')[0]; // Extract just the time
        const emoji = logType === 'ERROR' ? '🔴' : '🔵';
        
        logMessage += `${emoji} <code>${formattedTime}</code>: ${message}\n`;
      } else {
        logMessage += `${line}\n`;
      }
    });
    
    bot.sendMessage(chatId, logMessage, { parse_mode: 'HTML' });
  } catch (error) {
    bot.sendMessage(chatId, `❌ Ошибка при чтении логов: ${error.message}`);
    logError(`Failed to read logs: ${error.message}`);
  }
});

// Schedule command execution
bot.onText(/\/schedule ([^\s]+) (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id.toString();
  const timeString = match[1];
  const command = match[2];
  
  // Update stats
  stats.commandsProcessed++;
  saveStats();
  
  // Check if user has permission
  if (!canExecuteCommand(userId, '/schedule')) {
    bot.sendMessage(chatId, '❌ У вас нет прав для планирования заданий.');
    return;
  }
  
  // Parse time (accept time in formats like "12:30", "tomorrow 15:00", "2h30m")
  let scheduledTime;
  
  try {
    if (timeString.match(/^\d{1,2}:\d{2}$/)) {
      // Time format HH:MM for today
      const [hours, minutes] = timeString.split(':').map(Number);
      scheduledTime = new Date();
      scheduledTime.setHours(hours, minutes, 0, 0);
      
      // If time is in the past, schedule for tomorrow
      if (scheduledTime < new Date()) {
        scheduledTime.setDate(scheduledTime.getDate() + 1);
      }
    } else if (timeString.toLowerCase().startsWith('tomorrow')) {
      // Tomorrow at specific time
      const timeMatch = timeString.match(/tomorrow\s+(\d{1,2}):(\d{2})/i);
      if (timeMatch) {
        const hours = parseInt(timeMatch[1]);
        const minutes = parseInt(timeMatch[2]);
        
        scheduledTime = new Date();
        scheduledTime.setDate(scheduledTime.getDate() + 1);
        scheduledTime.setHours(hours, minutes, 0, 0);
      } else {
        throw new Error('Invalid time format for "tomorrow"');
      }
    } else if (timeString.match(/^(\d+)h(?:(\d+)m)?$/)) {
      // Relative time like "2h30m"
      const match = timeString.match(/^(\d+)h(?:(\d+)m)?$/);
      const hours = parseInt(match[1]);
      const minutes = match[2] ? parseInt(match[2]) : 0;
      
      scheduledTime = new Date();
      scheduledTime.setTime(scheduledTime.getTime() + hours * 60 * 60 * 1000 + minutes * 60 * 1000);
    } else {
      throw new Error('Неподдерживаемый формат времени');
    }
    
    // Ensure time is in the future
    if (scheduledTime <= new Date()) {
      throw new Error('Время должно быть в будущем');
    }
  } catch (error) {
    bot.sendMessage(chatId, `❌ Ошибка при определении времени: ${error.message}`);
    return;
  }
  
  // Generate a unique ID for the job
  const jobId = `job_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  
  // Schedule the job
  try {
    const job = schedule.scheduleJob(scheduledTime, async function() {
      try {
        // Execute command as if it was sent by the scheduler
        logMessage(`Executing scheduled command: ${command} (scheduled by user ${userId})`);
        
        // Send command to chat (simulating user input)
        // Need to use appropriate handler based on command type
        if (command.startsWith('/test ')) {
          const text = command.substring(6);
          const userName = getUserName(userId);
          const userRole = getUserRole(userId);
          
          // Format message based on user role with scheduled tag
          const roleEmoji = 
            userRole === 'owner' ? '👑' : 
            userRole === 'tech.admin' ? '⚙️' : 
            userRole === 'director' ? '🔱' : 
            userRole === 'admin' ? '🛡️' : '📢';
          
          const formattedMessage = `${roleEmoji} <b>Запланированное сообщение от ${userRole}</b> ${userName}\n\n${text}\n\n<i>(Запланировано на ${formatDate(scheduledTime)})</i>`;
          
          // Send to the group
          await bot.sendMessage(CONFIG.groupChatId, formattedMessage, { parse_mode: 'HTML' });
          bot.sendMessage(userId, `✅ Запланированное сообщение успешно отправлено в группу.`);
          stats.messagesSent++;
          saveStats();
        } else if (command.startsWith('/announce ')) {
          const announcement = command.substring(10);
          const userName = getUserName(userId);
          
          const announcementMessage = `📣 <b>ЗАПЛАНИРОВАННОЕ ОБЪЯВЛЕНИЕ</b> 📣\n\n${announcement}\n\n<i>От: ${userName} (запланировано на ${formatDate(scheduledTime)})</i>`;
          
          // Send to the group
          await bot.sendMessage(CONFIG.groupChatId, announcementMessage, { parse_mode: 'HTML' });
          bot.sendMessage(userId, `✅ Запланированное объявление успешно опубликовано!`);
          stats.messagesSent++;
          saveStats();
        } else if (command.startsWith('/broadcast ')) {
          const broadcastMessage = command.substring(11);
          const senderName = getUserName(userId);
          const formattedMessage = `📢 <b>ЗАПЛАНИРОВАННОЕ ВАЖНОЕ ОБЪЯВЛЕНИЕ</b>\n\n${broadcastMessage}\n\n<i>От: ${senderName} (запланировано на ${formatDate(scheduledTime)})</i>`;
          
          let sentCount = 0;
          let failedCount = 0;
          
          // Send to all users
          for (const targetId of Object.keys(users)) {
            try {
              await bot.sendMessage(targetId, formattedMessage, { parse_mode: 'HTML' });
              sentCount++;
              stats.messagesSent++;
              
              // Small delay to avoid hitting rate limits
              await new Promise(resolve => setTimeout(resolve, 50));
            } catch (error) {
              failedCount++;
              logError(`Failed to send scheduled broadcast to ${targetId}: ${error.message}`);
            }
          }
          
          bot.sendMessage(userId, `✅ Запланированная рассылка выполнена!\nУспешно: ${sentCount}, ошибок: ${failedCount}`);
          saveStats();
        } else {
          bot.sendMessage(userId, `❌ Неподдерживаемая команда для планирования: ${command}`);
        }
        
        // Remove from scheduled tasks
        delete scheduledTasks[jobId];
      } catch (error) {
        logError(`Error executing scheduled job ${jobId}: ${error.message}`);
        try {
          bot.sendMessage(userId, `❌ Ошибка при выполнении запланированной задачи: ${error.message}`);
        } catch (e) {
          logError(`Could not notify user about scheduled job failure: ${e.message}`);
        }
      }
    });
    
    // Store the job
    scheduledTasks[jobId] = {
      job,
      userId,
      command,
      scheduledTime: scheduledTime.toISOString(),
      createdAt: new Date().toISOString()
    };
    
    // Respond to user
    const formattedDate = formatDate(scheduledTime);
    bot.sendMessage(chatId, `✅ Задание успешно запланировано на ${formattedDate}.\nID задания: ${jobId}\n\nКоманда: ${command}`);
    logMessage(`User ${userId} scheduled command "${command}" for ${formattedDate} (ID: ${jobId})`);
  } catch (error) {
    bot.sendMessage(chatId, `❌ Ошибка при планировании задания: ${error.message}`);
    logError(`Failed to schedule task: ${error.message}`);
  }
});

// Cancel scheduled task
bot.onText(/\/cancel_schedule (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id.toString();
  const jobId = match[1];
  
  // Update stats
  stats.commandsProcessed++;
  saveStats();
  
  // Check if user has permission
  if (!canExecuteCommand(userId, '/cancel_schedule')) {
    bot.sendMessage(chatId, '❌ У вас нет прав для отмены запланированных заданий.');
    return;
  }
  
  // Check if job exists
  if (!scheduledTasks[jobId]) {
    bot.sendMessage(chatId, '❌ Задание с указанным ID не найдено.');
    return;
  }
  
  // Check if user is the owner of the job or has higher permission
  const jobOwnerId = scheduledTasks[jobId].userId;
  if (jobOwnerId !== userId && getUserPermissionLevel(userId) < getUserPermissionLevel(jobOwnerId)) {
    bot.sendMessage(chatId, '❌ Вы можете отменять только свои задания или задания пользователей с более низкой ролью.');
    return;
  }
  
  // Cancel the job
  try {
    scheduledTasks[jobId].job.cancel();
    const commandText = scheduledTasks[jobId].command;
    const scheduledTime = formatDate(scheduledTasks[jobId].scheduledTime);
    
    delete scheduledTasks[jobId];
    
    bot.sendMessage(chatId, `✅ Запланированное задание отменено.\nID: ${jobId}\nВремя: ${scheduledTime}\nКоманда: ${commandText}`);
    logMessage(`User ${userId} cancelled scheduled task ${jobId}`);
  } catch (error) {
    bot.sendMessage(chatId, `❌ Ошибка при отмене задания: ${error.message}`);
    logError(`Failed to cancel scheduled task ${jobId}: ${error.message}`);
  }
});

// List scheduled tasks
bot.onText(/\/list_scheduled/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id.toString();
  
  // Update stats
  stats.commandsProcessed++;
  saveStats();
  
  // Check if user has permission (same as for scheduling)
  if (!canExecuteCommand(userId, '/schedule')) {
    bot.sendMessage(chatId, '❌ У вас нет прав для просмотра запланированных заданий.');
    return;
  }
  
  // Check if there are any scheduled tasks
  const tasks = Object.entries(scheduledTasks);
  if (tasks.length === 0) {
    bot.sendMessage(chatId, '📅 Нет запланированных заданий.');
    return;
  }
  
  // Filter tasks based on user permissions
  const userPermissionLevel = getUserPermissionLevel(userId);
  const filteredTasks = tasks.filter(([_, task]) => {
    // Show all tasks for admins and above, only own tasks for others
    return userId === task.userId || userPermissionLevel >= PERMISSIONS.admin;
  });
  
  if (filteredTasks.length === 0) {
    bot.sendMessage(chatId, '📅 У вас нет запланированных заданий.');
    return;
  }
  
  // Sort tasks by scheduled time
  filteredTasks.sort((a, b) => new Date(a[1].scheduledTime) - new Date(b[1].scheduledTime));
  
  // Generate message
  let message = '📅 <b>Запланированные задания:</b>\n\n';
  
  filteredTasks.forEach(([id, task]) => {
    const scheduledTime = formatDate(task.scheduledTime);
    const shortCommand = task.command.length > 30 ? task.command.substring(0, 30) + '...' : task.command;
    const taskOwner = getUserName(task.userId);
    
    message += `🔹 <b>ID:</b> ${id}\n`;
    message += `📆 <b>Время:</b> ${scheduledTime}\n`;
    message += `👤 <b>Создатель:</b> ${taskOwner}\n`;
    message += `🔤 <b>Команда:</b> ${shortCommand}\n\n`;
  });
  
  message += `Для отмены задания используйте:\n/cancel_schedule <ID задания>`;
  
  bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
});

// Premium features
bot.onText(/\/premium/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id.toString();
  
  // Update stats
  stats.commandsProcessed++;
  saveStats();
  
  // Check if user has premium permission
  if (!canExecuteCommand(userId, '/premium')) {
    bot.sendMessage(chatId, '❌ У вас нет премиум-доступа. Обратитесь к администратору для получения премиум-роли.');
    return;
  }
  
  // Show premium features
let message = '💎 <b>ПРЕМИУМ ФУНКЦИИ</b> 💎\n\n';
message += '✨ <b>Доступные премиум команды:</b>\n';
message += '• /customstatus <i>ваш персональный статус</i> - Установить персональный статус\n';
message += '• /poll <i>вопрос</i> | <i>вариант1</i> | <i>вариант2</i> ... - Создать опрос в группе\n';
message += '• /meme <i>ваш текст</i> - Генерация мема с вашим текстом\n';
message += '• /weather <i>город</i> - Узнать погоду (с детальным прогнозом)\n\n';

message += '💫 <b>Преимущества премиум-пользователей:</b>\n';
message += '• Приоритетная поддержка от администрации\n';
message += '• Расширенный доступ к командам\n';
message += '• Персональный статус в группе\n';
message += '• Отсутствие ограничений на количество запросов\n';

bot.sendMessage(chatId, message, { parse_mode: 'HTML' });

});

// Custom status for premium users
bot.onText(/\/customstatus (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id.toString();
  const statusText = match[1];
  
  // Update stats
  stats.commandsProcessed++;
  saveStats();
  
  // Check if user has premium permission
  if (!canExecuteCommand(userId, '/premium')) {
    bot.sendMessage(chatId, '❌ У вас нет премиум-доступа. Обратитесь к администратору для получения премиум-роли.');
    return;
  }
  
// Validate status length
if (statusText.length > 50) {
    bot.sendMessage(chatId, '❌ Слишком длинный статус. Максимальная длина: 50 символов.');
    return;
  }
  
  // Save user status
  userStatuses[userId] = statusText;
  saveUserData();
  
  // Confirm status update
  bot.sendMessage(chatId, `✅ Ваш статус успешно изменен на: "${statusText}"`);
  logMessage(`User ${userId} set custom status: ${statusText}`);
});