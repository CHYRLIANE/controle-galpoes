import { Chart, registerables } from 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/+esm';
Chart.register(...registerables);

// Simple in-memory user storage (replace with proper backend in production)
const users = JSON.parse(localStorage.getItem('users')) || [];
let currentUser = null;

document.addEventListener('DOMContentLoaded', () => {
  initApp();
  
  // Optional: Additional setup for admin features
  const storedUser = localStorage.getItem('currentUser');
  if (storedUser) {
    const user = JSON.parse(storedUser);
    if (user.role === 'administrador') {
      setupAdminFunctionality();
    }
  }
});

function initApp() {
  // Check if user is logged in
  const storedUser = localStorage.getItem('currentUser');
  if (storedUser) {
    currentUser = JSON.parse(storedUser);
    showMainApp();
  } else {
    showLogin();
  }

  // Login Form Handler
  const loginForm = document.getElementById('login-form');
  loginForm?.addEventListener('submit', handleLogin);

  // Signup Form Handler
  const signupForm = document.getElementById('signup-form');
  signupForm?.addEventListener('submit', handleSignup);

  // Navigation Handlers
  setupNavigation();

  // Logout Handler
  const logoutBtn = document.getElementById('logout');
  logoutBtn?.addEventListener('click', handleLogout);

  // Initial Charts and Galpão Buttons
  initCharts();
  setupGalpaoButtons();

  // Update dashboard after initialization
  updateDashboardMetrics();

  // Set default date to today when form loads
  setupDailyRegistrationForm();
}

function handleLogin(e) {
  e.preventDefault();
  const cpf = document.getElementById('login-cpf').value;
  const senha = document.getElementById('login-senha').value;

  const user = users.find(u => u.cpf === cpf && u.senha === senha);
  
  if (user) {
    currentUser = user;
    localStorage.setItem('currentUser', JSON.stringify(user));
    showMainApp();
  } else {
    alert('CPF ou senha incorretos');
  }
}

function handleSignup(e) {
  e.preventDefault();
  const nome = document.getElementById('signup-nome').value;
  const cpf = document.getElementById('signup-cpf').value;
  const senha = document.getElementById('signup-senha').value;
  const confirmarScala = document.getElementById('signup-confirmar-senha').value;
  const role = document.querySelector('input[name="signup-role"]:checked')?.value;

  if (senha !== confirmarScala) {
    alert('Senhas não coincidem');
    return;
  }

  // Check if user already exists
  if (users.some(u => u.cpf === cpf)) {
    alert('Usuário já cadastrado');
    return;
  }

  const newUser = { nome, cpf, senha, role };
  users.push(newUser);
  localStorage.setItem('users', JSON.stringify(users));

  currentUser = newUser;
  localStorage.setItem('currentUser', JSON.stringify(newUser));
  showMainApp();
}

function handleLogout() {
  localStorage.removeItem('currentUser');
  currentUser = null;
  showLogin();
}

function showLogin() {
  document.getElementById('login').classList.remove('hidden');
  document.getElementById('signup').classList.add('hidden');
  document.getElementById('main-app').classList.add('hidden');
}

function showSignup() {
  document.getElementById('login').classList.add('hidden');
  document.getElementById('signup').classList.remove('hidden');
  document.getElementById('main-app').classList.add('hidden');
}

function showMainApp() {
  document.getElementById('login').classList.add('hidden');
  document.getElementById('signup').classList.add('hidden');
  document.getElementById('main-app').classList.remove('hidden');
  
  // Update user name and adjust navigation based on role
  const userNameEl = document.getElementById('user-name');
  if (userNameEl && currentUser) {
    userNameEl.textContent = currentUser.nome;
    
    // Hide/show sections based on user role
    const dashboardNavButtons = document.querySelectorAll('nav button');
    if (currentUser.role === 'colaborador') {
      // For collaborators, only show sections they can access
      dashboardNavButtons.forEach(button => {
        if (button.id !== 'dashboard-nav' && button.id !== 'colaborador-nav') {
          button.classList.add('hidden');
        }
      });
    } else {
      // For administrators, show all navigation buttons
      dashboardNavButtons.forEach(button => {
        button.classList.remove('hidden');
      });
    }
  }

  // Add event listener for daily registration form
  const registroDiarioForm = document.getElementById('registro-diario-form');
  registroDiarioForm?.addEventListener('submit', handleDailyRegistration);

  adjustNavigationForRole();
  setupDailyRegistrationForm();
}

function setupNavigation() {
  const navButtons = document.querySelectorAll('nav button');
  const sections = {
    'dashboard-nav': 'dashboard',
    'funcionarios-nav': 'funcionarios',
    'galpoes-nav': 'galpoes',
    'relatorios-nav': 'relatorios',
    'colaborador-nav': 'colaborador-cadastro'  
  };

  navButtons.forEach(button => {
    button.addEventListener('click', () => {
      const sectionId = sections[button.id];
      if (sectionId) {
        // Hide all sections
        ['dashboard', 'funcionarios', 'galpoes', 'relatorios', 'colaborador-cadastro'].forEach(sec => {
          document.getElementById(sec).classList.add('hidden');
        });
        
        // Show selected section
        document.getElementById(sectionId).classList.remove('hidden');
      }
    });
  });

  // Add event listeners for login/signup links
  document.getElementById('signup-link')?.addEventListener('click', (e) => {
    e.preventDefault();
    showSignup();
  });

  document.getElementById('login-link')?.addEventListener('click', (e) => {
    e.preventDefault();
    showLogin();
  });
}

function handleDailyRegistration(e) {
  e.preventDefault();
  
  const registrationData = {
    date: document.getElementById('registro-data').value, 
    userId: currentUser.cpf,
    galpao: document.getElementById('galpao-select').value,
    racao: {
      consumida: parseFloat(document.getElementById('racao-consumida').value),
      reposicao: parseFloat(document.getElementById('racao-reposicao').value || 0),
      precoCompra: currentUser.role === 'administrador' ? 
        parseFloat(document.getElementById('preco-racao-compra').value || 0) : null
    },
    ovos: {
      produzidos: parseInt(document.getElementById('ovos-produzidos').value),
      perdidos: parseInt(document.getElementById('ovos-perdidos').value),
      vendidos: currentUser.role === 'administrador' ? 
        parseInt(document.getElementById('ovos-vendidos').value || 0) : 0,
      precoVenda: currentUser.role === 'administrador' ? 
        parseFloat(document.getElementById('preco-ovos-venda').value || 0) : null
    },
    financeiro: currentUser.role === 'administrador' ? {
      precoRacaCompra: parseFloat(document.getElementById('preco-racao-compra').value || 0),
      precoOvosVenda: parseFloat(document.getElementById('preco-ovos-venda').value || 0),
      custoTotalRacao: parseFloat(document.getElementById('custo-total-racao').value || 0),
      receitaTotalOvos: parseFloat(document.getElementById('receita-total-ovos').value || 0)
    } : null,
    mortalidade: {
      galinhasMortas: parseInt(document.getElementById('galinhas-mortas').value)
    },
    observacoes: document.getElementById('observacoes').value
  };

  // Validate inputs
  if (!validateDailyRegistration(registrationData)) return;

  // Store registration
  const dailyRegistrations = JSON.parse(localStorage.getItem('dailyRegistrations') || '[]');
  dailyRegistrations.push(registrationData);
  localStorage.setItem('dailyRegistrations', JSON.stringify(dailyRegistrations));

  alert('Registro diário salvo com sucesso!');
  e.target.reset();
  updateDashboardMetrics();
}

function validateDailyRegistration(registrationData) {
  // Add validation logic here
  // For example:
  if (!registrationData.date) {
    alert('Por favor, selecione uma data para o registro.');
    return false;
  }
  // Add more validation rules as needed
  return true;
}

function setupDailyRegistrationForm() {
  const adminFinancialSection = document.getElementById('admin-financial-section');
  const racaoConsumo = document.getElementById('racao-consumida');
  const ovosVendidos = document.getElementById('ovos-vendidos');
  const dateInput = document.getElementById('registro-data');

  // Set today's date if not already set
  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;
  }

  // Show/hide financial section based on user role
  if (currentUser && currentUser.role === 'administrador') {
    adminFinancialSection.classList.remove('hidden');
  } else {
    adminFinancialSection.classList.add('hidden');
  }

  // Add event listeners for financial calculations
  racaoConsumo.addEventListener('input', calculateFinancials);
  ovosVendidos.addEventListener('input', calculateFinancials);
  
  // Only show financial inputs for admin
  const financialInputs = [
    'preco-racao-compra', 
    'preco-ovos-venda', 
    'custo-total-racao', 
    'receita-total-ovos'
  ];

  financialInputs.forEach(inputId => {
    const input = document.getElementById(inputId);
    if (input) {
      input.style.display = currentUser && currentUser.role === 'administrador' ? 'block' : 'none';
    }
  });
}

function calculateFinancials() {
  // Check if user is an administrator
  if (!currentUser || currentUser.role !== 'administrador') return;

  const racaoConsumo = parseFloat(document.getElementById('racao-consumida').value) || 0;
  const precoRacaCompra = parseFloat(document.getElementById('preco-racao-compra').value) || 0;
  const ovosVendidos = parseInt(document.getElementById('ovos-vendidos').value) || 0;
  const precoOvosVenda = parseFloat(document.getElementById('preco-ovos-venda').value) || 0;

  const custoTotalRacao = racaoConsumo * precoRacaCompra;
  const receitaTotalOvos = ovosVendidos * precoOvosVenda;

  document.getElementById('custo-total-racao').value = custoTotalRacao.toFixed(2);
  document.getElementById('receita-total-ovos').value = receitaTotalOvos.toFixed(2);
}

function adjustNavigationForRole() {
  const navElement = document.querySelector('nav');
  
  if (currentUser.role === 'colaborador') {
    const colaboradorNavButton = document.createElement('button');
    colaboradorNavButton.id = 'colaborador-nav';
    colaboradorNavButton.textContent = 'Registro Diário';
    navElement.appendChild(colaboradorNavButton);
    
    // Re-run navigation setup to add event listeners
    setupNavigation();
  } else if (currentUser.role === 'administrador') {
    setupAdminFunctionality();
  }
}

function initCharts() {
  // Gráfico de Produção de Ovos for dynamically updating based on selected galpão
  window.producaoOvosChart = new Chart(document.getElementById('chart-producao-ovos'), {
    type: 'line',
    data: {
      labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
      datasets: [{
        label: 'Ovos Produzidos',
        data: [200, 220, 180, 250, 240, 210, 230],
        borderColor: '#8B4513',
        tension: 0.4
      }]
    }
  });

  // Gráfico de Consumo de Ração for dynamically updating based on selected galpão
  window.consumoRacaoChart = new Chart(document.getElementById('chart-consumo-racao'), {
    type: 'bar',
    data: {
      labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
      datasets: [{
        label: 'Kg de Ração',
        data: [50, 55, 45, 60, 58, 52, 56],
        backgroundColor: '#D2B48C'
      }]
    }
  });

  // Setup galpão button event listeners
  setupGalpaoButtons();
}

function setupGalpaoButtons() {
  const galpaoButtons = document.querySelectorAll('.galpao-btn');
  galpaoButtons.forEach(button => {
    button.addEventListener('click', () => {
      const galpaoId = button.dataset.galpao;
      updateDashboardForGalpao(galpaoId);
    });
  });
}

function updateDashboardForGalpao(galpaoId) {
  const dailyRegistrations = JSON.parse(localStorage.getItem('dailyRegistrations') || '[]');
  
  // Filter registrations for the selected galpão
  const galpaoRegistrations = dailyRegistrations.filter(reg => reg.galpao === galpaoId);

  // Update summary cards
  const totalOvosProducao = galpaoRegistrations.reduce((sum, reg) => sum + reg.ovos.produzidos, 0);
  const totalOvosEstoque = calculateTotalOvosEstoque(galpaoRegistrations);
  const totalRacaoConsumida = galpaoRegistrations.reduce((sum, reg) => sum + reg.racao.consumida, 0);
  const totalGalinhasMortas = galpaoRegistrations.reduce((sum, reg) => sum + reg.mortalidade.galinhasMortas, 0);

  document.getElementById('ovos-total').textContent = totalOvosProducao.toLocaleString();
  document.getElementById('ovos-estoque').textContent = totalOvosEstoque.toLocaleString();
  document.getElementById('racao-consumida').textContent = `${totalRacaoConsumida.toFixed(1)} kg`;
  document.getElementById('galinhas-mortas').textContent = totalGalinhasMortas.toLocaleString();

  // Update charts
  updateCharts(galpaoRegistrations);
}

function updateCharts(galpaoRegistrations) {
  // Group registrations by day of the week
  const dailyData = {
    'Seg': [], 'Ter': [], 'Qua': [], 'Qui': [], 'Sex': [], 'Sáb': [], 'Dom': []
  };

  galpaoRegistrations.forEach(reg => {
    const date = new Date(reg.date);
    const dayOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][date.getDay()];
    
    dailyData[dayOfWeek].push({
      ovos: reg.ovos.produzidos,
      racao: reg.racao.consumida
    });
  });

  // Calculate averages for each day
  const ovosData = Object.keys(dailyData).map(day => 
    dailyData[day].length 
      ? dailyData[day].reduce((sum, item) => sum + item.ovos, 0) / dailyData[day].length 
      : 0
  );

  const racaoData = Object.keys(dailyData).map(day => 
    dailyData[day].length 
      ? dailyData[day].reduce((sum, item) => sum + item.racao, 0) / dailyData[day].length 
      : 0
  );

  // Update charts
  window.producaoOvosChart.data.datasets[0].data = ovosData;
  window.producaoOvosChart.update();

  window.consumoRacaoChart.data.datasets[0].data = racaoData;
  window.consumoRacaoChart.update();
}

function updateDashboardMetrics() {
  const dailyRegistrations = JSON.parse(localStorage.getItem('dailyRegistrations') || '[]');
  
  // Get today's registrations (use the selected date filter)
  const todayInput = document.getElementById('registro-data');
  const today = todayInput ? todayInput.value : new Date().toISOString().split('T')[0];
  const todaysRegistrations = dailyRegistrations.filter(reg => reg.date === today);

  // Calculate dashboard metrics
  const totalOvosProducao = todaysRegistrations.reduce((sum, reg) => sum + reg.ovos.produzidos, 0);
  const totalOvosEstoque = calculateTotalOvosEstoque(dailyRegistrations);
  const totalRacaoConsumida = todaysRegistrations.reduce((sum, reg) => sum + reg.racao.consumida, 0);
  const totalGalinhasMortas = todaysRegistrations.reduce((sum, reg) => sum + reg.mortalidade.galinhasMortas, 0);

  // Update dashboard elements
  document.getElementById('ovos-total').textContent = totalOvosProducao.toLocaleString();
  document.getElementById('ovos-estoque').textContent = totalOvosEstoque.toLocaleString();
  document.getElementById('racao-consumida').textContent = `${totalRacaoConsumida.toFixed(1)} kg`;
  document.getElementById('galinhas-mortas').textContent = totalGalinhasMortas.toLocaleString();
}

function calculateTotalOvosEstoque(registrations) {
  const totalProduzidos = registrations.reduce((sum, reg) => sum + reg.ovos.produzidos, 0);
  const totalPerdidos = registrations.reduce((sum, reg) => sum + reg.ovos.perdidos, 0);
  const totalVendidos = registrations.reduce((sum, reg) => sum + reg.ovos.vendidos, 0);
  return totalProduzidos - totalPerdidos - totalVendidos;
}

function setupAdminFunctionality() {
  // Funcionários Management
  const adicionarFuncionarioBtn = document.getElementById('adicionar-funcionario');
  const modalAdicionarFuncionario = document.getElementById('modal-adicionar-funcionario');
  const formAdicionarFuncionario = document.getElementById('form-adicionar-funcionario');
  const funcionariosLista = document.getElementById('funcionarios-lista');

  adicionarFuncionarioBtn?.addEventListener('click', () => {
    modalAdicionarFuncionario.classList.remove('hidden');
  });

  document.querySelectorAll('.close-modal').forEach(closeBtn => {
    closeBtn.addEventListener('click', () => {
      closeBtn.closest('.modal').classList.add('hidden');
    });
  });

  formAdicionarFuncionario?.addEventListener('submit', (e) => {
    e.preventDefault();
    const nome = document.getElementById('novo-funcionario-nome').value;
    const cpf = document.getElementById('novo-funcionario-cpf').value;
    const role = document.getElementById('novo-funcionario-role').value;
    const senha = document.getElementById('novo-funcionario-senha').value;

    const newUser = { nome, cpf, role, senha };
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));

    renderFuncionariosList();
    modalAdicionarFuncionario.classList.add('hidden');
    formAdicionarFuncionario.reset();
  });

  function renderFuncionariosList() {
    funcionariosLista.innerHTML = users.map(user => `
      <tr>
        <td>${user.nome}</td>
        <td>${user.cpf}</td>
        <td>${user.role}</td>
        <td>
          <button class="editar-funcionario" data-cpf="${user.cpf}">Editar</button>
          <button class="excluir-funcionario" data-cpf="${user.cpf}">Excluir</button>
        </td>
      </tr>
    `).join('');

    // Add event listeners for edit and delete
    document.querySelectorAll('.excluir-funcionario').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const cpf = e.target.dataset.cpf;
        const updatedUsers = users.filter(u => u.cpf !== cpf);
        localStorage.setItem('users', JSON.stringify(updatedUsers));
        renderFuncionariosList();
      });
    });
  }

  renderFuncionariosList();

  // Galpões Management
  const adicionarGalpaoBtn = document.getElementById('adicionar-galpao');
  const modalAdicionarGalpao = document.getElementById('modal-adicionar-galpao');
  const formAdicionarGalpao = document.getElementById('form-adicionar-galpao');
  const galpoesLista = document.getElementById('galpoes-lista');

  const galpoes = JSON.parse(localStorage.getItem('galpoes')) || [];

  adicionarGalpaoBtn?.addEventListener('click', () => {
    modalAdicionarGalpao.classList.remove('hidden');
  });

  formAdicionarGalpao?.addEventListener('submit', (e) => {
    e.preventDefault();
    const nome = document.getElementById('novo-galpao-nome').value;
    const capacidade = document.getElementById('novo-galpao-capacidade').value;

    const newGalpao = { id: galpoes.length + 1, nome, capacidade };
    galpoes.push(newGalpao);
    localStorage.setItem('galpoes', JSON.stringify(galpoes));

    renderGalpoesList();
    modalAdicionarGalpao.classList.add('hidden');
    formAdicionarGalpao.reset();
  });

  function renderGalpoesList() {
    galpoesLista.innerHTML = galpoes.map(galpao => `
      <div class="galpao-item">
        <h4>${galpao.nome}</h4>
        <p>Capacidade: ${galpao.capacidade}</p>
      </div>
    `).join('');
  }

  renderGalpoesList();

  // Enhance Daily Registration for Admin
  const ovosVendidosInput = document.getElementById('ovos-vendidos');
  const precoOvosInput = document.getElementById('preco-ovos');
  const valorVendaOvosInput = document.getElementById('valor-venda-ovos');

  ovosVendidosInput?.addEventListener('input', updateValorVendaOvos);
  precoOvosInput?.addEventListener('input', updateValorVendaOvos);

  function updateValorVendaOvos() {
    const ovosVendidos = parseInt(ovosVendidosInput.value) || 0;
    const precoOvos = parseFloat(precoOvosInput.value) || 0;
    const valorTotal = ovosVendidos * precoOvos;
    valorVendaOvosInput.value = valorTotal.toFixed(2);
  }
}