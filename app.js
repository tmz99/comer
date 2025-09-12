// Variables globales
let sidebarCollapsed = false;
let currentSection = 'dashboard';

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    updateTime();
    setInterval(updateTime, 1000);

    // Event listeners para navegación
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            const section = this.getAttribute('data-section');
            if (section === 'logout') {
                showNotification('Sesión cerrada exitosamente');
                return;
            }
            navigateToSection(section);
        });
    });

    // Event listener para input del chat (Enter)
    document.getElementById('chatInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    // Simulación de actualizaciones en tiempo real
    setInterval(updateShipmentStatus, 30000);
});

// Función para mostrar la hora actual
function updateTime() {
    const now = new Date();
    const timeString = now.toLocaleString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    document.getElementById('current-time').textContent = timeString;
}

// Función para alternar sidebar
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebarCollapsed = !sidebarCollapsed;
    sidebar.classList.toggle('collapsed', sidebarCollapsed);
}

// Navegación entre secciones
function navigateToSection(section) {
    const allSections = document.querySelectorAll('.content-section');
    allSections.forEach(s => s.classList.add('hidden'));

    const targetSection = document.getElementById(section + '-content');
    if (targetSection) {
        targetSection.classList.remove('hidden');
        targetSection.classList.add('fade-in');
    }

    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => item.classList.remove('active'));

    const activeNavItem = document.querySelector(`[data-section="${section}"]`);
    if (activeNavItem) {
        activeNavItem.classList.add('active');
    }

    const titles = {
        'dashboard': 'Dashboard Principal',
        'importaciones': 'Gestión de Importaciones',
        'exportaciones': 'Gestión de Exportaciones',
        'seguimiento': 'Seguimiento de Envíos',
        'marketplace': 'Marketplace Global',
        'fiscal': 'Fiscal y Normativo',
        'historial': 'Historial de Operaciones',
        'documentos': 'Gestión Documental',
        'escaneo': 'Escaneo con IA',
        'plantilla': 'Plantillas de Documentos',
        'perfil': 'Mi Perfil',
        'configuracion': 'Configuración'
    };

    document.getElementById('page-title').textContent = titles[section] || 'TradeFlow';
    currentSection = section;

    showNotification(`Navegando a ${titles[section]}`);
}

// --- CHATBOT --- //

// Alternar ventana del chat
function toggleChat() {
    document.getElementById("chatbotWindow").classList.toggle("hidden");
}

// Enviar mensaje
function sendMessage() {
    const input = document.getElementById("chatInput");
    const message = input.value.trim();
    if (message === '') return;

    addMessage(message, 'user');
    input.value = '';

    // Simular respuesta del asistente con delay
    setTimeout(() => {
        const responses = [
            `He revisado tu consulta sobre "${message}". Te puedo ayudar con información detallada al respecto.`,
            `Entiendo tu pregunta sobre "${message}". Basándome en tus operaciones actuales, te recomiendo...`,
            `Perfecto. Sobre "${message}", puedo proporcionarte datos actualizados y sugerencias específicas.`,
            `Revisando tu historial para "${message}". Encontré información relevante que puede ser útil.`
        ];
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        addMessage(randomResponse, 'assistant');
    }, 1000 + Math.random() * 2000);
}

// Agregar mensaje al chat
function addMessage(text, sender) {
    const messagesContainer = document.getElementById("chatMessages");
    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${sender}`;
    messageDiv.textContent = text;
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Acciones rápidas (si querés mantenerlas)
function quickAction(action) {
    const actions = {
        'status': 'Mostrándote el estado actual de todos tus envíos activos...',
        'docs': 'Accediendo a tus documentos más recientes y pendientes...',
        'customs': 'Revisando el estado aduanero de tus operaciones...',
        'costs': 'Calculando costos y análisis de rentabilidad...'
    };
    addMessage(actions[action], 'assistant');
}

// Mostrar notificaciones
function showNotification(message) {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.classList.add('show');
    setTimeout(() => notification.classList.remove('show'), 3000);
}

// Simulación de actualizaciones en envíos
function updateShipmentStatus() {
    const shipments = document.querySelectorAll('.shipment-item');
    const randomShipment = shipments[Math.floor(Math.random() * shipments.length)];
    if (randomShipment && Math.random() > 0.7) {
        randomShipment.classList.add('pulse');
        setTimeout(() => randomShipment.classList.remove('pulse'), 2000);
        showNotification('Estado de envío actualizado');
        setTimeout(() => {
            addMessage('He detectado una actualización en el estado de uno de tus envíos. ¿Te gustaría revisar los detalles?', 'assistant');
        }, 3000);
    }
}
