/**
 * AMBROS · Global UI/UX Layout Engine (ChatGPT Style)
 * Manages sidebar collapse, bottom profile card, popover, notification badges, and modals.
 */

(function () {
  // 1. Immediately apply collapsed state from localStorage to prevent layout flicker
  const isCollapsed = localStorage.getItem("ambros_sidebar_collapsed") === "true";
  if (isCollapsed) {
    document.documentElement.classList.add("ambros-pre-collapsed");
  }

  // Helper to get authenticated user safely
  function getAuthUser() {
    try {
      const raw = localStorage.getItem("ambros_usuario") || sessionStorage.getItem("ambros_usuario");
      if (raw) return JSON.parse(raw);
    } catch (_) {}
    return { nome: "Administrador", email: "adm@adm.com", perfil: "administrador" };
  }

  function getAuthToken() {
    return localStorage.getItem("ambros_token") || sessionStorage.getItem("ambros_token");
  }

  // Safe modal display (works with or without bootstrap.Modal)
  function showModalSafe(modalId) {
    const el = document.getElementById(modalId);
    if (!el) return;
    if (typeof bootstrap !== "undefined" && bootstrap.Modal) {
      try {
        const inst = bootstrap.Modal.getInstance(el) || new bootstrap.Modal(el);
        inst.show();
        return;
      } catch (_) {}
    }
    // Fallback display
    el.classList.add("show");
    el.style.display = "block";
    let backdrop = document.getElementById(modalId + "-backdrop");
    if (!backdrop) {
      backdrop = document.createElement("div");
      backdrop.id = modalId + "-backdrop";
      backdrop.className = "modal-backdrop fade show";
      document.body.appendChild(backdrop);
    }
  }

  function hideModalSafe(modalId) {
    const el = document.getElementById(modalId);
    if (!el) return;
    if (typeof bootstrap !== "undefined" && bootstrap.Modal) {
      try {
        const inst = bootstrap.Modal.getInstance(el);
        if (inst) {
          inst.hide();
          return;
        }
      } catch (_) {}
    }
    el.classList.remove("show");
    el.style.display = "none";
    const backdrop = document.getElementById(modalId + "-backdrop");
    if (backdrop) backdrop.remove();
  }

  // Global logout
  window.logout = function () {
    localStorage.removeItem("ambros_token");
    localStorage.removeItem("ambros_usuario");
    sessionStorage.removeItem("ambros_token");
    sessionStorage.removeItem("ambros_usuario");
    window.location.href = "login.html";
  };

  // Toggle Sidebar Collapse
  window.toggleSidebarCollapse = function () {
    const sidebar = document.getElementById("sidebar");
    const main = document.querySelector(".main");
    if (!sidebar) return;

    sidebar.classList.toggle("collapsed");
    if (main) main.classList.toggle("collapsed");

    const collapsedNow = sidebar.classList.contains("collapsed");
    localStorage.setItem("ambros_sidebar_collapsed", collapsedNow ? "true" : "false");
  };

  // Toggle User Popover
  window.toggleUserPopover = function (e) {
    if (e) e.stopPropagation();
    const popover = document.getElementById("userPopover");
    if (!popover) return;
    const isVisible = popover.style.display === "block";
    popover.style.display = isVisible ? "none" : "block";
  };

  // Click on Avatar: directly open notifications & clear badge (Fix for Bug A)
  window.handleAvatarClick = function (e) {
    if (e) e.stopPropagation();
    window.openNotifModal();
  };

  // Open Help / Support Modal
  window.openHelpModal = function () {
    const pop = document.getElementById("userPopover");
    if (pop) pop.style.display = "none";
    showModalSafe("helpModal");
  };

  // Open Notifications Modal and immediately clear badge (Bug A fix)
  window.openNotifModal = function () {
    const pop = document.getElementById("userPopover");
    if (pop) pop.style.display = "none";

    showModalSafe("notifModal");

    // Immediately remove red badge dot from avatar so it never gets stuck
    const dot = document.getElementById("sidebarAvatarDot");
    if (dot) dot.classList.remove("show");

    const popBadge = document.getElementById("popoverNotifBadge");
    if (popBadge) popBadge.style.display = "none";

    localStorage.setItem("ambros_notifs_lidas", "true");

    // Fire API call to mark as read
    const token = getAuthToken();
    if (token) {
      fetch("/portal/notificacoes-sistema/marcar-lidas", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }

    // Load and render notifications
    carregarNotificacoesSistema();
  };

  // Mark all notifications as read manually
  window.marcarNotificacoesComoLidas = async function () {
    const dot = document.getElementById("sidebarAvatarDot");
    if (dot) dot.classList.remove("show");

    const badgeUnread = document.getElementById("popoverNotifBadge");
    if (badgeUnread) badgeUnread.style.display = "none";

    const badgeHeader = document.getElementById("modalNotifCount");
    if (badgeHeader) badgeHeader.textContent = "0 pendentes";

    const list = document.getElementById("listaNotificacoes");
    if (list) {
      list.querySelectorAll(".badge-nova").forEach((el) => el.remove());
    }

    const btnMarcar = document.getElementById("btnMarcarLidas");
    if (btnMarcar) btnMarcar.disabled = true;

    localStorage.setItem("ambros_notifs_lidas", "true");

    const token = getAuthToken();
    try {
      if (token) {
        await fetch("/portal/notificacoes-sistema/marcar-lidas", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch (_) {}
  };

  // Open Unified Profile & Settings Modal
  window.openEditProfile = function () {
    const pop = document.getElementById("userPopover");
    if (pop) pop.style.display = "none";

    const user = getAuthUser();
    const nomeInp = document.getElementById("profileNome");
    const emailInp = document.getElementById("profileEmail");
    const perfilInp = document.getElementById("profilePerfil");
    const senhaInp = document.getElementById("profileSenha");
    const avatarInp = document.getElementById("profileAvatarUrl");
    const avatarPrev = document.getElementById("profileAvatarPreview");

    const savedAvatar = localStorage.getItem("ambros_avatar_url") || "https://i.pravatar.cc/80?img=12";

    if (nomeInp) nomeInp.value = user.nome || "Administrador";
    if (emailInp) emailInp.value = user.email || "adm@adm.com";
    if (perfilInp) {
      perfilInp.value = user.perfil
        ? user.perfil.charAt(0).toUpperCase() + user.perfil.slice(1)
        : "Administrador";
    }
    if (senhaInp) senhaInp.value = "";
    if (avatarInp) avatarInp.value = savedAvatar;
    if (avatarPrev) avatarPrev.src = savedAvatar;

    const err = document.getElementById("profileError");
    const succ = document.getElementById("profileSuccess");
    if (err) err.style.display = "none";
    if (succ) succ.style.display = "none";

    showModalSafe("editProfileModal");
  };

  // Fetch notifications to determine badge visibility
  async function checarNotificacoesPendentes() {
    const token = getAuthToken();
    if (!token) return;

    try {
      const resp = await fetch("/portal/notificacoes-sistema", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (resp.ok) {
        const data = await resp.json();
        const pendentes = data.total_pendentes || 0;
        const jaLidas = localStorage.getItem("ambros_notifs_lidas") === "true";

        const dot = document.getElementById("sidebarAvatarDot");
        const popBadge = document.getElementById("popoverNotifBadge");

        if (pendentes > 0 && !jaLidas) {
          if (dot) dot.classList.add("show");
          if (popBadge) {
            popBadge.textContent = pendentes;
            popBadge.style.display = "inline-block";
          }
        } else {
          if (dot) dot.classList.remove("show");
          if (popBadge) popBadge.style.display = "none";
        }
      }
    } catch (_) {}
  }

  // Load and render notifications in modal
  async function carregarNotificacoesSistema() {
    const token = getAuthToken();
    const list = document.getElementById("listaNotificacoes");
    if (!list) return;

    list.innerHTML = '<div class="text-center py-4 text-muted"><div class="spinner-border spinner-border-sm me-2"></div>Carregando notificações...</div>';

    try {
      const resp = await fetch("/portal/notificacoes-sistema", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (resp.ok) {
        const data = await resp.json();
        const lista = data.notificacoes || [];
        const countEl = document.getElementById("modalNotifCount");
        if (countEl) countEl.textContent = `${lista.length} avisos no histórico`;

        const btnMarcar = document.getElementById("btnMarcarLidas");
        if (btnMarcar) btnMarcar.disabled = true;

        if (lista.length === 0) {
          list.innerHTML = '<div class="text-center py-4 text-muted"><i class="bi bi-bell-slash fs-3 d-block mb-2 text-secondary"></i>Nenhum aviso ou notificação no momento.</div>';
          return;
        }

        list.innerHTML = lista.map((n) => {
          const d = new Date(n.enviado_em);
          const dataFmt = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

          return `
            <div class="p-3 mb-2 rounded border bg-white shadow-sm">
              <div class="d-flex justify-content-between align-items-center mb-1">
                <span class="fw-bold text-dark"><i class="bi bi-info-circle-fill text-primary me-2"></i>${n.titulo || 'Notificação do Sistema'}</span>
                <span class="text-muted small">${dataFmt}</span>
              </div>
              <div class="text-secondary small mt-1">${n.mensagem}</div>
            </div>
          `;
        }).join('');
      } else {
        list.innerHTML = '<div class="text-center py-4 text-muted">Nenhum aviso pendente.</div>';
      }
    } catch (_) {
      list.innerHTML = '<div class="text-center py-4 text-muted">Nenhum aviso pendente.</div>';
    }
  }

  // Inject standard modals into document if missing
  function injectModals() {
    if (!document.getElementById("editProfileModal")) {
      const modalProfileHtml = `
        <div class="modal fade" id="editProfileModal" tabindex="-1" aria-hidden="true">
          <div class="modal-dialog modal-lg">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title"><i class="bi bi-person-gear me-2"></i>Perfil & Configurações da Conta</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" onclick="hideModalSafe('editProfileModal')" aria-label="Fechar"></button>
              </div>
              <div class="modal-body">
                <form id="editProfileForm">
                  <div class="row">
                    <div class="col-md-4 text-center border-end mb-3 mb-md-0">
                      <div class="mb-3">
                        <img id="profileAvatarPreview" src="https://i.pravatar.cc/80?img=12" alt="Avatar" class="rounded-circle shadow-sm" style="width: 90px; height: 90px; object-fit: cover;">
                      </div>
                      <div class="mb-3">
                        <label class="form-label small fw-bold">URL da Foto / Avatar</label>
                        <input type="text" class="form-control form-control-sm" id="profileAvatarUrl" placeholder="https://..." oninput="document.getElementById('profileAvatarPreview').src = this.value || 'https://i.pravatar.cc/80?img=12'">
                      </div>
                    </div>
                    <div class="col-md-8">
                      <div class="mb-3">
                        <label class="form-label">Nome Completo</label>
                        <input type="text" class="form-control" id="profileNome" required>
                      </div>
                      <div class="mb-3">
                        <label class="form-label">E-mail</label>
                        <input type="email" class="form-control" id="profileEmail" required>
                      </div>
                      <div class="mb-3">
                        <label class="form-label">Nova Senha (deixe em branco para não alterar)</label>
                        <input type="password" class="form-control" id="profileSenha" placeholder="••••••••">
                      </div>
                      <div class="mb-3">
                        <label class="form-label">Perfil / Função</label>
                        <input type="text" class="form-control" id="profilePerfil" disabled style="background:#e9ecef;">
                      </div>
                      <hr>
                      <h6 class="text-muted fw-bold small text-uppercase mb-2">Configurações Gerais do Sistema</h6>
                      <div class="row g-2">
                        <div class="col-6">
                          <label class="form-label small">Tema da Interface</label>
                          <select class="form-select form-select-sm" id="prefTema">
                            <option value="dark">Escuro (Sidebar) / Claro (Conteúdo)</option>
                            <option value="light">Claro Padrão</option>
                          </select>
                        </div>
                        <div class="col-6">
                          <label class="form-label small">Notificações Sonoras</label>
                          <select class="form-select form-select-sm" id="prefNotif">
                            <option value="ativadas">Ativadas</option>
                            <option value="silenciosas">Silenciosas</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="text-danger small mb-2 mt-3" id="profileError" style="display:none;"></div>
                  <div class="text-success small mb-2 mt-3" id="profileSuccess" style="display:none;">Perfil atualizado com sucesso!</div>
                  <div class="d-flex justify-content-end gap-2 mt-3">
                    <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal" onclick="hideModalSafe('editProfileModal')">Cancelar</button>
                    <button type="submit" class="btn btn-primary btn-sm">Salvar Alterações</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      `;
      document.body.insertAdjacentHTML("beforeend", modalProfileHtml);
    }

    if (!document.getElementById("helpModal")) {
      const modalHelpHtml = `
        <div class="modal fade" id="helpModal" tabindex="-1" aria-hidden="true">
          <div class="modal-dialog">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title"><i class="bi bi-headset me-2 text-primary"></i>Suporte Técnico AMBROS</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" onclick="hideModalSafe('helpModal')" aria-label="Fechar"></button>
              </div>
              <div class="modal-body">
                <p class="text-muted small">Precisa de auxílio com o sistema de controle de acesso? Nossa equipe de suporte está à disposição:</p>
                <div class="p-3 bg-light rounded mb-3 border">
                  <div class="mb-2"><i class="bi bi-whatsapp text-success fs-5 me-2 align-middle"></i><strong>WhatsApp / Celular:</strong> <span class="text-dark">(11) 99888-7766</span></div>
                  <div><i class="bi bi-envelope-at text-primary fs-5 me-2 align-middle"></i><strong>E-mail de Suporte:</strong> <span class="text-dark">suporte@ambros-sistemas.com.br</span></div>
                </div>
                <div class="small text-muted">Horário de atendimento: Segunda a Sexta, das 08h às 18h (Plantão 24h para emergências de portaria).</div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal" onclick="hideModalSafe('helpModal')">Fechar</button>
              </div>
            </div>
          </div>
        </div>
      `;
      document.body.insertAdjacentHTML("beforeend", modalHelpHtml);
    }

    if (!document.getElementById("notifModal")) {
      const modalNotifHtml = `
        <div class="modal fade" id="notifModal" tabindex="-1" aria-hidden="true">
          <div class="modal-dialog">
            <div class="modal-content">
              <div class="modal-header">
                <div>
                  <h5 class="modal-title mb-0"><i class="bi bi-bell me-2 text-danger"></i>Alertas & Notificações</h5>
                  <small class="text-muted" id="modalNotifCount">Carregando...</small>
                </div>
                <button type="button" class="btn-close" data-bs-dismiss="modal" onclick="hideModalSafe('notifModal')" aria-label="Fechar"></button>
              </div>
              <div class="modal-body" style="max-height: 400px; overflow-y: auto;">
                <div id="listaNotificacoes"></div>
              </div>
              <div class="modal-footer d-flex justify-content-between">
                <button type="button" class="btn btn-outline-primary btn-sm" id="btnMarcarLidas" onclick="marcarNotificacoesComoLidas()">
                  <i class="bi bi-check2-all me-1"></i>Marcar todas como lidas
                </button>
                <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal" onclick="hideModalSafe('notifModal')">Fechar</button>
              </div>
            </div>
          </div>
        </div>
      `;
      document.body.insertAdjacentHTML("beforeend", modalNotifHtml);
    }

    // Bind form submit for profile modal
    const form = document.getElementById("editProfileForm");
    if (form && !form.dataset.bound) {
      form.dataset.bound = "true";
      form.addEventListener("submit", async function (e) {
        e.preventDefault();
        const nome = document.getElementById("profileNome").value;
        const email = document.getElementById("profileEmail").value;
        const senha = document.getElementById("profileSenha").value;
        const avUrl = document.getElementById("profileAvatarUrl").value;
        const errEl = document.getElementById("profileError");
        const succEl = document.getElementById("profileSuccess");

        if (errEl) errEl.style.display = "none";
        if (succEl) succEl.style.display = "none";

        try {
          const token = getAuthToken();
          const res = await fetch("/auth/me", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ nome, email, senha: senha ? senha : undefined }),
          });

          const data = await res.json();
          if (!res.ok) throw new Error(data.detail || "Erro ao atualizar perfil");

          if (localStorage.getItem("ambros_token")) {
            localStorage.setItem("ambros_token", data.access_token);
            localStorage.setItem("ambros_usuario", JSON.stringify(data.usuario));
          } else {
            sessionStorage.setItem("ambros_token", data.access_token);
            sessionStorage.setItem("ambros_usuario", JSON.stringify(data.usuario));
          }

          if (avUrl) {
            localStorage.setItem("ambros_avatar_url", avUrl);
            const avatarImg = document.getElementById("sidebarAvatarImg");
            if (avatarImg) avatarImg.src = avUrl;
          }

          const sn = document.getElementById("sidebarUserName");
          if (sn) sn.textContent = data.usuario.nome;

          if (succEl) succEl.style.display = "block";
          setTimeout(() => {
            hideModalSafe("editProfileModal");
          }, 1200);
        } catch (err) {
          if (errEl) {
            errEl.textContent = err.message;
            errEl.style.display = "block";
          }
        }
      });
    }
  }

  // Setup layout elements on DOM Ready
  function initLayout() {
    const sidebar = document.getElementById("sidebar");
    const main = document.querySelector(".main");

    if (!sidebar) return;

    // Apply stored collapse state cleanly
    if (localStorage.getItem("ambros_sidebar_collapsed") === "true") {
      sidebar.classList.add("collapsed");
      if (main) main.classList.add("collapsed");
    }
    document.documentElement.classList.remove("ambros-pre-collapsed");

    // 1. Clean brand header inside sidebar with indestructible logo & collapse toggle
    const brand = sidebar.querySelector(".brand");
    if (brand) {
      brand.innerHTML = `
        <div class="logo" onclick="toggleSidebarCollapse()" title="AMBROS"><i class="fa-solid fa-shield-halved"></i></div>
        <div class="brand-text">
          <div class="name">AMBROS</div>
          <div class="sub">CONTROLE DE ACESSO</div>
        </div>
        <button class="collapse-btn" onclick="toggleSidebarCollapse()" title="Recolher / Expandir barra lateral">
          <i class="bi bi-layout-sidebar"></i>
        </button>
      `;
    }

    // 2. Remove legacy profile element at the top of the sidebar if present
    const oldProfiles = sidebar.querySelectorAll(".profile");
    oldProfiles.forEach((p) => p.remove());

    // 3. Remove legacy "Sair do Sistema" item inside sidebar-nav if present
    const navItems = sidebar.querySelectorAll(".sidebar-nav .nav-item");
    navItems.forEach((item) => {
      if (item.textContent.includes("Sair") && (item.classList.contains("text-danger") || item.getAttribute("onclick")?.includes("logout"))) {
        item.remove();
      }
    });

    // 4. Remove legacy footer text inside sidebar
    const oldFoot = sidebar.querySelector(".sidebar-foot");
    if (oldFoot) oldFoot.remove();

    // 5. Ensure "Usuários do Sistema" link exists in Gestão & Auditoria
    const relatoriosGroup = document.getElementById("grp-relatorios");
    if (relatoriosGroup) {
      const subitems = relatoriosGroup.querySelector(".nav-subitems");
      if (subitems && !subitems.querySelector('a[href="usuarios.html"]')) {
        const userLink = document.createElement("a");
        userLink.className = "nav-subitem admin-only";
        userLink.href = "usuarios.html";
        userLink.innerHTML = '<i class="bi bi-people-fill"></i><span>Usuários do Sistema</span>';
        subitems.appendChild(userLink);
      }
    }

    // 6. Build or ensure the ChatGPT-style bottom user card with popover
    let userContainer = sidebar.querySelector(".sidebar-user-container");
    if (!userContainer) {
      userContainer = document.createElement("div");
      userContainer.className = "sidebar-user-container";
      sidebar.appendChild(userContainer);
    }

    const authUser = getAuthUser();
    const avatarUrl = localStorage.getItem("ambros_avatar_url") || "https://i.pravatar.cc/80?img=12";

    userContainer.innerHTML = `
      <div class="user-card" onclick="toggleUserPopover(event)" title="Minha Conta & Notificações">
        <div class="avatar-wrapper" onclick="handleAvatarClick(event)" title="Notificações">
          <img src="${avatarUrl}" alt="Avatar" id="sidebarAvatarImg">
          <span class="avatar-badge-dot" id="sidebarAvatarDot" title="Notificações pendentes"></span>
        </div>
        <div class="user-info">
          <div class="uname" id="sidebarUserName">${authUser.nome || "Administrador"}</div>
          <div class="ustatus"><span class="dot"></span>Online</div>
        </div>
        <i class="bi bi-three-dots text-muted"></i>
      </div>

      <div class="user-popover" id="userPopover">
        <button type="button" onclick="openNotifModal(); event.stopPropagation();">
          <i class="bi bi-bell"></i>
          <span>Notificações</span>
          <span class="badge-unread" id="popoverNotifBadge" style="display:none;">0</span>
        </button>
        <button type="button" onclick="openEditProfile(); event.stopPropagation();">
          <i class="bi bi-person-gear"></i>
          <span>Perfil</span>
        </button>
        <button type="button" onclick="openHelpModal(); event.stopPropagation();">
          <i class="bi bi-headset"></i>
          <span>Ajuda</span>
        </button>
        <div class="divider"></div>
        <button type="button" class="danger" onclick="logout(); event.stopPropagation();">
          <i class="bi bi-box-arrow-right"></i>
          <span>Sair</span>
        </button>
      </div>
    `;

    // 7. Clean topbar / header completely (100% minimalist, no burger, no topuser, no bell)
    const topbars = document.querySelectorAll(".topbar");
    topbars.forEach((tb) => {
      tb.querySelectorAll(".burger").forEach((b) => b.remove());
      tb.querySelectorAll(".topuser").forEach((u) => u.remove());
      tb.querySelectorAll(".bell").forEach((b) => b.remove());
    });

    // 8. Admin role check for menu items
    const isAdmin = authUser.perfil === "administrador" || authUser.perfil === "admin" || authUser.email === "adm@adm.com";
    document.querySelectorAll(".admin-only").forEach((el) => {
      el.style.display = isAdmin ? "flex" : "none";
    });

    // 9. Click-away to close popover
    document.addEventListener("click", function (e) {
      const pop = document.getElementById("userPopover");
      const container = document.querySelector(".sidebar-user-container");
      if (pop && container && !container.contains(e.target)) {
        pop.style.display = "none";
      }
    });

    // 10. Inject modals into body and check notification alerts
    injectModals();
    checarNotificacoesPendentes();
  }

  // Run on DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initLayout);
  } else {
    initLayout();
  }
})();
