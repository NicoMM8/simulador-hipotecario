document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('mortgage-form');
    const yearsInput = document.getElementById('years');
    const yearsDisplay = document.getElementById('years-display');
    const filterBtns = document.querySelectorAll('.filter-btn');
    
    // Summary nodes
    const loanAmountNode = document.getElementById('loan-amount');
    const loanPctNode = document.getElementById('loan-pct');
    const expenseseNode = document.getElementById('estimated-expenses');
    const maxMonthlyNode = document.getElementById('max-monthly');
    const resultsContainer = document.getElementById('mortgage-results');
    const savingsWarning = document.getElementById('savings-warning');

    let currentMortgageType = 'fixed';

    // Service Worker Registration
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('sw.js').catch(err => console.log('SW ref failed', err));
        });
    }

    // Leer parámetros de la URL e inicializar
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('precio')) {
        document.getElementById('house-price').value = urlParams.get('precio');
    }
    if (urlParams.has('ahorros')) {
        document.getElementById('savings').value = urlParams.get('ahorros');
    }
    if (urlParams.has('comunidad')) {
        const option = Array.from(document.getElementById('location').options).find(opt => opt.text.toLowerCase().includes(urlParams.get('comunidad').toLowerCase()));
        if (option) document.getElementById('location').value = option.value;
    }

    // --- Autoguardado LocalStorage ---
    function autoSaveForm() {
        const formData = {
            price: document.getElementById('house-price').value,
            savings: document.getElementById('savings').value,
            age: document.getElementById('age').value,
            applicants: document.getElementById('applicants').value,
            incomeNet: document.getElementById('income-net').value,
            incomeGross: document.getElementById('income-gross').value,
            dependents: document.getElementById('dependents').value,
            specialStatus: document.getElementById('special-status').value,
            location: document.getElementById('location').value,
            isRural: document.getElementById('is-rural').checked,
            years: document.getElementById('years').value,
            euriborScenario: document.getElementById('euribor-scenario').value
        };
        localStorage.setItem('mortgage_autosave', JSON.stringify(formData));
    }

    function loadAutoSave() {
        if (!urlParams.toString()) { // Sólo autocompletar si no hay URL params forzando otros datos
            const saved = JSON.parse(localStorage.getItem('mortgage_autosave'));
            if (saved) {
                if (saved.price) document.getElementById('house-price').value = saved.price;
                if (saved.savings) document.getElementById('savings').value = saved.savings;
                if (saved.age) document.getElementById('age').value = saved.age;
                if (saved.applicants) document.getElementById('applicants').value = saved.applicants;
                if (saved.incomeNet) document.getElementById('income-net').value = saved.incomeNet;
                if (saved.incomeGross) document.getElementById('income-gross').value = saved.incomeGross;
                if (saved.dependents) document.getElementById('dependents').value = saved.dependents;
                if (saved.specialStatus) document.getElementById('special-status').value = saved.specialStatus;
                if (saved.location) document.getElementById('location').value = saved.location;
                if (saved.isRural !== undefined) document.getElementById('is-rural').checked = saved.isRural;
                if (saved.years) document.getElementById('years').value = saved.years;
                if (saved.euriborScenario) document.getElementById('euribor-scenario').value = saved.euriborScenario;
            }
        }
    }
    
    loadAutoSave();
    form.addEventListener('input', autoSaveForm);

    // --- Lógica de Perfiles ---
    const profilesContainer = document.getElementById('profiles-container');
    const saveProfileBtn = document.getElementById('save-profile-btn');
    const noProfilesMsg = document.getElementById('no-profiles-msg');

    function loadProfiles() {
        const profiles = JSON.parse(localStorage.getItem('mortgage_profiles')) || [];
        if (profiles.length === 0) {
            noProfilesMsg.style.display = 'block';
            profilesContainer.innerHTML = '';
            profilesContainer.appendChild(noProfilesMsg);
            return;
        }

        noProfilesMsg.style.display = 'none';
        profilesContainer.innerHTML = '';
        
        profiles.forEach((p, index) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'filter-btn';
            btn.style.backgroundColor = 'white';
            btn.style.border = '1px solid var(--border-color)';
            btn.innerHTML = `${p.name} <span class="delete-profile" data-index="${index}" style="margin-left:5px; color:var(--danger-color); font-weight:bold;">&times;</span>`;
            
            btn.addEventListener('click', (e) => {
                if (e.target.classList.contains('delete-profile')) {
                    deleteProfile(e.target.dataset.index);
                    return;
                }
                
                document.getElementById('house-price').value = p.price;
                document.getElementById('savings').value = p.savings;
                document.getElementById('income').value = p.income;
                document.getElementById('location').value = p.location;
                if(p.isYoung !== undefined) document.getElementById('is-young').checked = p.isYoung;
                
                calculateAndRender();
            });
            profilesContainer.appendChild(btn);
        });
    }

    function saveProfile() {
        if (!form.checkValidity()) {
            alert('Por favor, rellena todos los datos primero para crear un perfil.');
            return;
        }
        
        const name = prompt('Nombre para este perfil (ej: Pareja 1, Madrid Joven):');
        if (!name) return;

        const profile = {
            name: name,
            price: document.getElementById('house-price').value,
            savings: document.getElementById('savings').value,
            income: document.getElementById('income').value,
            location: document.getElementById('location').value,
            isYoung: document.getElementById('is-young').checked
        };

        const profiles = JSON.parse(localStorage.getItem('mortgage_profiles')) || [];
        profiles.push(profile);
        localStorage.setItem('mortgage_profiles', JSON.stringify(profiles));
        loadProfiles();
    }

    function deleteProfile(index) {
        if (!confirm('¿Seguro que quieres borrar este perfil?')) return;
        const profiles = JSON.parse(localStorage.getItem('mortgage_profiles')) || [];
        profiles.splice(index, 1);
        localStorage.setItem('mortgage_profiles', JSON.stringify(profiles));
        loadProfiles();
    }

    saveProfileBtn.addEventListener('click', saveProfile);
    loadProfiles(); // Initialize profiles
    // --------------------------

    let costChart = null;

    function getFormValues() {
        return {
            price: parseFloat(document.getElementById('house-price').value) || 0,
            savings: parseFloat(document.getElementById('savings').value) || 0,
            age: parseInt(document.getElementById('age').value) || 35,
            applicants: parseInt(document.getElementById('applicants').value) || 1,
            incomeNet: parseFloat(document.getElementById('income-net').value) || 0,
            incomeGross: parseFloat(document.getElementById('income-gross').value) || 0,
            dependents: parseInt(document.getElementById('dependents').value) || 0,
            specialStatus: document.getElementById('special-status').value,
            location: document.getElementById('location').value,
            isRural: document.getElementById('is-rural').checked,
            years: parseInt(document.getElementById('years').value) || 25,
            euriborBase: parseFloat(document.getElementById('euribor-scenario').value) || 2.38
        };
    }

    function calculateITP(location, age, price, specialStatus, isRural) {
        let itp = 10;
        switch(location) {
            case 'MAD': itp = (age < 35 && price <= 250000) ? 6 * 0.9 : 6; break;
            case 'CAT': itp = (age < 32 && specialStatus !== 'none') ? 5 : 10; break;
            case 'CVA': itp = (['large-family', 'single-parent', 'disability', 'victim'].includes(specialStatus)) ? 4 : (age < 35 ? 8 : 10); break;
            case 'AND': itp = (age < 35 && price <= 150000) ? 3.5 : 7; break;
            case 'CYL': itp = (age < 36 || isRural) ? 5 : 8; break;
            case 'PVA': itp = 4; break;
            case 'NAV': itp = 5; break;
            case 'BAL': itp = 8; break;
            case 'GAL': itp = 9; break;
            case 'AST': itp = (age < 35 && price <= 150000) ? 3 : 8; break;
            case 'MUR': itp = (age < 35) ? 3 : 8; break;
            case 'CANT': itp = (age < 30) ? 5 : 8; break;
            case 'CAN': itp = 6.5; break;
            case 'CLM': itp = 9; break;
            case 'EXT': itp = 8; break;
            case 'RIO': itp = 7; break;
            case 'CEU': itp = 6; break;
        }
        return itp;
    }

    function checkICOAval(age, incomeGross, applicants, dependents, specialStatus) {
        let baseLimit = applicants === 1 ? 37800 : 75600;
        baseLimit += (dependents * 2520);
        if (specialStatus === 'single-parent') baseLimit *= 1.70;
        
        const meetsIncome = incomeGross > 0 && incomeGross <= baseLimit;
        const meetsProfile = age <= 35 || dependents > 0;
        return meetsIncome && meetsProfile;
    }

    function calculateRuralSubsidy(age, price, isRural, incomeGross, dependents) {
        if (isRural && price <= 120000 && age <= 35) {
            let ipremLimit = dependents >= 3 ? 42000 : 25200;
            if (incomeGross > 0 && incomeGross <= ipremLimit) return Math.min(10800, price * 0.20);
        }
        return 0;
    }

    function checkPartialSavings() {
        if(!document.getElementById('house-price').value || !document.getElementById('savings').value) return;
        const v = getFormValues();
        if(v.price === 0 || !v.location) return;
        
        const itpPct = calculateITP(v.location, v.age, v.price, v.specialStatus, v.isRural);
        const expenses = v.price * (itpPct / 100) + (v.price * 0.02) + 1500;
        
        const hasICO = checkICOAval(v.age, v.incomeGross, v.applicants, v.dependents, v.specialStatus);
        const maxLoanBank = v.price * (hasICO ? 1.00 : 0.80);
        const ruralSubsidy = calculateRuralSubsidy(v.age, v.price, v.isRural, v.incomeGross, v.dependents);
        
        const requiredLoan = (v.price + expenses) - (v.savings + ruralSubsidy);

        if (requiredLoan > maxLoanBank) {
            savingsWarning.classList.remove('hidden');
            savingsWarning.innerHTML = `⚠️ Necesitas financiar <strong>el ${((requiredLoan / v.price) * 100).toFixed(1)}%</strong>. El límite habitual es 80% (${formatCurrency(maxLoanBank)}). ${hasICO ? 'Aunque aplicaría el Aval ICO, tus ahorros no cubren los gastos notariales/ITP.' : 'El Aval ICO no se aplica por superar ingresos/edad.'}`;
        } else {
            savingsWarning.classList.add('hidden');
        }
    }

    document.getElementById('savings').addEventListener('blur', checkPartialSavings);
    document.getElementById('house-price').addEventListener('blur', checkPartialSavings);

    yearsInput.addEventListener('input', (e) => {
        yearsDisplay.textContent = e.target.value;
    });

    filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            filterBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentMortgageType = e.target.dataset.type;
            
            // Re-calculate if form is fully filled
            if (form.checkValidity()) {
                calculateAndRender();
            }
        });
    });

    document.getElementById('euribor-scenario').addEventListener('change', () => {
        if(currentMortgageType === 'variable' && form.checkValidity()) calculateAndRender();
    });

    document.getElementById('sort-by').addEventListener('change', () => {
        calculateAndRender();
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        calculateAndRender();
    });

    function updateChart(price, expenses, savingsUsed) {
        const loan = (price + expenses) - savingsUsed;
        const ctx = document.getElementById('cost-chart').getContext('2d');
        
        if (costChart) {
            costChart.destroy();
        }
        
        costChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Hipoteca Necesaria', 'Tus Ahorros', 'Gastos e Impuestos'],
                datasets: [{
                    data: [loan > 0 ? loan : 0, savingsUsed, expenses],
                    backgroundColor: ['#005ce6', '#00A388', '#fca5a5'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '65%',
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });
    }

    function calculateAndRender() {
        const v = getFormValues();

        if (v.price === 0 || v.savings === 0 || v.incomeNet === 0 || !v.location) {
            return;
        }

        const itpPct = calculateITP(v.location, v.age, v.price, v.specialStatus, v.isRural);
        const expenses = v.price * (itpPct / 100) + (v.price * 0.02) + 1500; 
        
        const hasICO = checkICOAval(v.age, v.incomeGross, v.applicants, v.dependents, v.specialStatus);
        const ruralSubsidy = calculateRuralSubsidy(v.age, v.price, v.isRural, v.incomeGross, v.dependents);
        
        const totalCost = v.price + expenses;
        const netSavings = v.savings + ruralSubsidy; // Subsidy serves as entry capital
        const requiredLoan = totalCost - netSavings;
        
        const maxLoanBank = v.price * (hasICO ? 1.00 : 0.80);
        
        // Update Summary
        if (requiredLoan > 0) {
            loanAmountNode.textContent = formatCurrency(requiredLoan);
            const pct = ((requiredLoan / v.price) * 100).toFixed(1);
            
            let badgesHTML = '';
            if (hasICO) badgesHTML += '<span class="req-badge" style="background:#005ce6;color:white;border-color:#005ce6;" title="Aval ICO del Estado aprobado. Permite llegar hasta el 100% de financiación por perfil de ingresos/edad.">Aval ICO Activo ✅</span> ';
            if (ruralSubsidy > 0) badgesHTML += `<span class="req-badge warning" title="Subvención de Reto Demográfico aplicable para compras en municipios rurales.">+ Subvención ${formatCurrency(ruralSubsidy)}</span>`;
            
            loanPctNode.innerHTML = `${pct}% del precio ${badgesHTML}`;
            
            if (requiredLoan > maxLoanBank) loanAmountNode.style.color = '#fca5a5';
            else loanAmountNode.style.color = 'var(--text-color)';
        } else {
            loanAmountNode.textContent = "0 €";
            loanPctNode.textContent = "Préstamo no requerido";
        }

        expenseseNode.innerHTML = `${formatCurrency(expenses)} <br><span style="font-size:0.8rem; color:var(--primary-color); font-weight:600;" title="El tipo de ITP se ha calculado asimétricamente analizando tu CCAA, tu edad y circunstancias especiales.">ITP Aplicado: ${itpPct}%</span>`;
        
        const recommendedMaxFee = v.incomeNet * 0.35;
        maxMonthlyNode.textContent = formatCurrency(recommendedMaxFee);

        checkPartialSavings();

        if (requiredLoan <= 0) {
            resultsContainer.innerHTML = '<div class="empty-state"><p>Tus ahorros y ayudas cubren el total de la vivienda y los gastos. ¡No necesitas hipoteca! 😊</p></div>';
            document.getElementById('chart-container').style.display = 'none';
            return;
        }

        document.getElementById('chart-container').style.display = 'block';
        updateChart(v.price, expenses, netSavings > totalCost ? totalCost : netSavings);

        renderMortgages(requiredLoan, v.years, recommendedMaxFee, v.price, hasICO, v.euriborBase);
    }

    function renderMortgages(loan, years, maxFee, housePrice, hasICO, euriborBase) {
        resultsContainer.innerHTML = '';
        
        let filtered = MORTGAGES.filter(m => {
            return m.type === currentMortgageType && years <= m.maxYears;
        });
        
        if (filtered.length === 0) {
            resultsContainer.innerHTML = '<div class="empty-state"><p>No hay ofertas disponibles para este plazo y tipo de hipoteca.</p></div>';
            return;
        }

        const sortMode = document.getElementById('sort-by').value;
        
        filtered.sort((a, b) => {
            if (sortMode === 'tin') {
                let tinA = a.type === 'variable' ? (euriborBase + a.spread) : a.tin;
                let tinB = b.type === 'variable' ? (euriborBase + b.spread) : b.tin;
                return tinA - tinB;
            } else {
                return a.tae - b.tae;
            }
        });

        const currentPct = loan / housePrice;

        filtered.forEach((m, index) => {
            let allowedFinancing = m.maxFinancing;
            if (hasICO && m.icoAllowed) allowedFinancing = 1.00;
            const ltvExceeded = currentPct > allowedFinancing;
            
            let currentTin = m.type === 'variable' ? (euriborBase + m.spread) : m.tin;
            let monthlyPayment = calculatePMT(currentTin, years, loan);
            const isTooExpensive = monthlyPayment > maxFee;

            const div = document.createElement('div');
            div.className = `mortgage-item ${ltvExceeded ? 'denied' : ''}`;
            div.style.animationDelay = `${index * 0.05}s`;

            div.innerHTML = `
                <div class="bank-info">
                    <div class="bank-name">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"></path><path d="M5 21V7l8-4v18"></path><path d="M19 21V11l-6-3"></path><path d="M9 14h2"></path></svg>
                        ${m.bank}
                    </div>
                    <div class="mortgage-type">Hipoteca ${m.type === 'fixed' ? 'Fija' : (m.type === 'variable' ? 'Variable' : `Mixta (${m.fixedYears} años fija)`)}</div>
                    <div class="req-badge" title="Condiciones impuestas por la entidad para acceder al tipo de interés bonificado mostrado.">Vinculación: ${m.requirements ? m.requirements.join(', ') : 'Ninguna'}</div>
                    ${ltvExceeded ? `<div class="req-badge error" style="margin-top: 5px;" title="Límite superado. El banco requiere que aportes más ahorros propios para cuadrar la operación bajando el préstamo requerido.">⚠️ Supera el ${allowedFinancing * 100}% de LTV</div>` : ''}
                </div>
                
                <div class="rates">
                    <div class="rate-box">
                        <div class="rate-value">${currentTin.toFixed(2)}%</div>
                        <div class="rate-label">TIN ${m.type === 'mixed' ? 'Fijo Inicial' : (m.type === 'variable' ? 'Simul.' : '')}</div>
                    </div>
                    <div class="rate-box">
                        <div class="rate-value" style="color: var(--primary-color);">${m.type === 'variable' ? (currentTin + 0.1).toFixed(2) : m.tae.toFixed(2)}%</div>
                        <div class="rate-label">TAE ${m.type === 'mixed' ? 'Variable' : '(Aprox)'}</div>
                    </div>
                    ${(m.type === 'variable' || m.type === 'mixed') ? `
                    <div class="rate-box">
                        <div class="rate-value" style="font-size:1.2rem; margin-top:0.3rem;">+${m.spread.toFixed(2)}%</div>
                        <div class="rate-label">Euribor ${m.type === 'mixed' ? `(Año ${m.fixedYears + 1}+)` : 'más'}</div>
                    </div>
                    ` : ''}
                </div>
                
                <div class="payment-info">
                    <div class="monthly-payment ${isTooExpensive ? 'danger' : ''}">
                        ${formatCurrency(monthlyPayment)}<span style="font-size: 1rem; color: #94a3b8; font-weight: normal;"> /mes</span>
                    </div>
                    <div class="payment-label">Cuota inicial</div>
                    ${isTooExpensive ? '<div class="req-badge error" title="El Banco de España recomienda no destinar más del 35% de ingresos netos a la cuota hipotecaria. Operación de alto riesgo.">⚠️ Supera límite 35%</div>' : ''}
                    ${(!isTooExpensive && !ltvExceeded) ? '<div class="req-badge warning" title="Perfil económico apto. Tienes viabilidad para solicitar esta financiación.">✅ Viable</div>' : ''}
                    <button class="btn-primary" style="background:#5e6c84; margin-top: 0.5rem; padding: 0.6rem 1rem; font-size: 0.85rem;" onclick="showAmortization(${loan}, ${currentTin}, ${years})">Ver Cuadro</button>
                    <a href="https://www.google.com/search?q=Hipoteca+${m.bank}" target="_blank" class="btn-primary" style="display:inline-block; padding: 0.6rem 1rem; margin-top: 0.5rem; text-decoration: none; text-align: center; font-size: 0.85rem;">Ir al Banco</a>
                </div>
            `;
            resultsContainer.appendChild(div);
        });
    }

    function calculatePMT(rate, years, principal) {
        if (rate === 0) return principal / (years * 12);
        const r = rate / 100 / 12;
        const n = years * 12;
        return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    }

    function formatCurrency(value) {
        return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
    }

    // Modal logic is globally accessible via window
    window.showAmortization = function(principal, rate, years) {
        const modal = document.getElementById('amortization-modal');
        const tbody = document.getElementById('amortization-body');
        tbody.innerHTML = '';
        
        let r = rate / 100 / 12;
        let p = principal;
        const n = years * 12;
        const pmt = calculatePMT(rate, years, principal);
        
        let yearlyPmt = 0;
        let yearlyInterest = 0;
        let yearlyPrincipal = 0;
        
        for (let i = 1; i <= n; i++) {
            let interest = p * r;
            let amortized = pmt - interest;
            p = p - amortized;
            
            yearlyPmt += pmt;
            yearlyInterest += interest;
            yearlyPrincipal += amortized;
            
            if (i % 12 === 0 || i === n) {
                const year = Math.ceil(i / 12);
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${year}</td>
                    <td>${formatCurrency(yearlyPmt)}</td>
                    <td>${formatCurrency(yearlyInterest)}</td>
                    <td>${formatCurrency(yearlyPrincipal)}</td>
                    <td>${formatCurrency(Math.max(0, p))}</td>
                `;
                tbody.appendChild(tr);
                
                yearlyPmt = 0;
                yearlyInterest = 0;
                yearlyPrincipal = 0;
            }
        }
        
        modal.classList.remove('hidden');
    };
    
    document.getElementById('close-modal').addEventListener('click', () => {
        document.getElementById('amortization-modal').classList.add('hidden');
    });

    document.getElementById('download-pdf').addEventListener('click', () => {
        const element = document.getElementById('pdf-content-area');
        const opt = {
            margin:       0.5,
            filename:     'Simulacion_Hipotecaria_2026.pdf',
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true, windowWidth: 1024 },
            jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' },
            pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }
        };
        
        // Ocultar acciones temporalmente
        const headerActions = document.querySelector('.mortgage-list-header > div:nth-child(2)');
        const originalDisplay = headerActions.style.display;
        headerActions.style.display = 'none';
        
        html2pdf().from(element).set(opt).save().then(() => {
            headerActions.style.display = originalDisplay;
        });
    });
});
