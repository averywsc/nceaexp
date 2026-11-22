/* ==========================================================================
   WSCW NCEA Guide - Interactive Logic
   Zero emojis, zero em dashes, zero visual clutter.
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  initViewNavigation();
  initWscwCoursePlanner();
  initGradeScaleExplorer();
  initCertSimulator();
  initCourseEndorsementTester();
  initUeRankCalculator();
  initAccordions();
  initGlossary();
});

const WSCW_STATE = {
  activeYear: "y12",
  selected: {
    y11: new Set(),
    y12: new Set(),
    y13: new Set()
  }
};

/* --------------------------------------------------------------------------
   1. Clean Top-Level View Switching
   -------------------------------------------------------------------------- */
function switchView(viewName) {
  const tabs = document.querySelectorAll(".nav-tab");
  const panels = document.querySelectorAll(".view-panel");

  tabs.forEach((t) => t.classList.toggle("active", t.getAttribute("data-view") === viewName));
  panels.forEach((p) => p.classList.toggle("active", p.id === `view-${viewName}`));

  window.scrollTo({ top: 0, behavior: "smooth" });
  try {
    if (history.replaceState) {
      history.replaceState(null, "", `#${viewName}`);
    }
  } catch (e) {
    // Ignore history restrictions on file:// URLs
  }
}

function initViewNavigation() {
  document.querySelectorAll(".nav-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      switchView(tab.getAttribute("data-view"));
    });
  });

  document.querySelectorAll("[data-nav-view]").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      switchView(el.getAttribute("data-nav-view"));
    });
  });

  const hash = window.location.hash.replace("#", "");
  if (["courses", "basics", "endorsements", "university", "rules"].includes(hash)) {
    switchView(hash);
  }
}

/* --------------------------------------------------------------------------
   2. WSCW Courses & Credits Planner (Year 11, Year 12, Year 13)
   -------------------------------------------------------------------------- */
const YEAR_INFO = {
  y11: {
    label: "Year 11",
    targetSubjects: 6,
    bannerTitle: "Year 11 at WSCW: Two Pathways",
    bannerText:
      "Springs (mainstream) students take 6 subjects (English, Mathematics, Science, plus 3 options) on a 2-year NCEA Level 2 pathway, where each course offers one Level 2 standard (typically 2 to 6 credits, banking roughly 20 to 30 Level 2 credits before Year 12). Ngā Puna o Waiōrea students take Level 1 courses (20 credits each in Pāngarau, Pūtaiao, Te Reo Māori / Rangatira, plus options) toward NCEA Level 1. All Year 11 students also complete the 20-credit Literacy and Numeracy Co-requisite."
  },
  y12: {
    label: "Year 12 (Level 2)",
    targetSubjects: 6,
    bannerTitle: "Year 12 (NCEA Level 2) at WSCW",
    bannerText:
      "Year 12 students take English (or Te Reo Pākehā / ESOL) plus 5 optional subjects (4 options for Waiōrea students). Most WSCW Level 2 courses offer 16 to 22 credits. Combined with any Level 2 credits banked in Year 11, you need 60 Level 2 credits plus the Co-requisite for NCEA Level 2, and 50 Merit or Excellence credits for a Certificate Endorsement."
  },
  y13: {
    label: "Year 13 (Level 3)",
    targetSubjects: 5,
    bannerTitle: "Year 13 (NCEA Level 3) at WSCW",
    bannerText:
      "Year 13 students choose 5 subjects (English must be included if you have not yet gained UE Literacy). All WSCW Level 3 courses offer at least 14 credits. Most courses require 12 Level 2 credits in that subject or HOD approval. For University Entrance, make sure at least 3 of your subjects are UE-approved with 14+ credits each."
  }
};

function findCourseIdByMatch(year, substrings) {
  const list = (window.WSCW_COURSES && window.WSCW_COURSES[year]) || [];
  for (const sub of substrings) {
    const found = list.find((c) => c.title.toLowerCase().includes(sub.toLowerCase()));
    if (found) return found.id;
  }
  return null;
}

function loadTypicalForYear(year) {
  const presets = {
    y11: [
      ["year 11 english (11eng)"],
      ["year 11 mathematics"],
      ["year 11 science (11sci)"],
      ["year 11 business"],
      ["year 11 history"],
      ["year 11 visual art"]
    ],
    y12: [
      ["level 2 english & te reo"],
      ["level 2 advanced mathematics"],
      ["level 2 biology"],
      ["level 2 chemistry"],
      ["level 2 history"],
      ["level 2 economics"]
    ],
    y13: [
      ["level 3 english & te reo"],
      ["level 3 calculus"],
      ["level 3 biology"],
      ["level 3 chemistry"],
      ["level 3 economics"]
    ]
  };
  WSCW_STATE.selected[year].clear();
  (presets[year] || []).forEach((matchers) => {
    const id = findCourseIdByMatch(year, matchers);
    if (id) WSCW_STATE.selected[year].add(id);
  });
}

function initWscwCoursePlanner() {
  if (!window.WSCW_COURSES) return;

  loadTypicalForYear("y11");
  loadTypicalForYear("y12");
  loadTypicalForYear("y13");

  const yearBtns = document.querySelectorAll("[data-year]");
  const searchInput = document.getElementById("courseSearch");
  const facultySel = document.getElementById("facultyFilter");
  const pathwaySel = document.getElementById("pathwayFilter");
  const loadSampleBtn = document.getElementById("loadSampleTimetable");
  const clearBtn = document.getElementById("clearTimetable");

  const populateFacultyFilter = () => {
    const courses = window.WSCW_COURSES[WSCW_STATE.activeYear] || [];
    const faculties = Array.from(new Set(courses.map((c) => c.faculty))).sort();
    const prev = facultySel.value;
    facultySel.innerHTML =
      `<option value="all">All Learning Areas</option>` +
      faculties.map((f) => `<option value="${escapeHtml(f)}">${escapeHtml(f)}</option>`).join("");
    if (faculties.includes(prev)) facultySel.value = prev;
  };

  const renderAll = () => {
    const yr = WSCW_STATE.activeYear;
    const info = YEAR_INFO[yr];

    yearBtns.forEach((b) => b.classList.toggle("active", b.getAttribute("data-year") === yr));
    pathwaySel.style.display = yr === "y11" ? "inline-block" : "none";

    document.getElementById("yearPathwayBanner").innerHTML = `
      <h3>${escapeHtml(info.bannerTitle)}</h3>
      <p>${escapeHtml(info.bannerText)}</p>
    `;

    renderSummary();
    renderCourseGrid();
  };

  const renderSummary = () => {
    const yr = WSCW_STATE.activeYear;
    const info = YEAR_INFO[yr];
    const allCourses = window.WSCW_COURSES[yr] || [];
    const chosen = allCourses.filter((c) => WSCW_STATE.selected[yr].has(c.id));

    const totalTypical = chosen.reduce((acc, c) => acc + c.typical, 0);
    const totalInt = chosen.reduce((acc, c) => acc + c.internal, 0);
    const totalExt = chosen.reduce((acc, c) => acc + c.external, 0);
    const totalUeR = chosen.reduce((acc, c) => acc + c.ueRead, 0);
    const totalUeW = chosen.reduce((acc, c) => acc + c.ueWrite, 0);

    document.getElementById("summaryTitle").textContent = `Your ${info.label} Timetable Breakdown`;
    document.getElementById("summaryHeadline").textContent = `${chosen.length} of ${info.targetSubjects} typical subjects selected`;
    document.getElementById("metricTotal").textContent = String(totalTypical);
    document.getElementById("metricInternal").textContent = String(totalInt);
    document.getElementById("metricExternal").textContent = String(totalExt);

    const extraActions = document.getElementById("summaryExtraActions");
    if (yr === "y13" && chosen.length > 0) {
      extraActions.innerHTML = `<button type="button" class="btn btn-primary btn-sm" id="sendToRankBtn">Send to Rank Score Calculator</button>`;
      document.getElementById("sendToRankBtn").addEventListener("click", () => {
        importSelectedY13IntoRankCalculator();
        switchView("university");
      });
    } else {
      extraActions.innerHTML = "";
    }

    const goalEl = document.getElementById("metricGoal");
    const goalLbl = document.getElementById("metricGoalLbl");
    const verdictEl = document.getElementById("summaryVerdict");

    if (yr === "y11") {
      const hasWaiorea = chosen.some((c) => c.pathway.includes("Waiōrea"));
      if (hasWaiorea) {
        goalEl.textContent = `${totalTypical} / 60`;
        goalLbl.textContent = "Toward NCEA Level 1";
        verdictEl.textContent =
          chosen.length === 0
            ? "Select subjects below to see how many credits you earn across your Year 11 timetable."
            : `Your selection includes Ngā Puna o Waiōrea Level 1 courses totalling ${totalTypical} credits (${totalInt} internal, ${totalExt} external). You need 60 credits plus the 20-credit Co-requisite for NCEA Level 1.`;
      } else {
        goalEl.textContent = `${totalTypical} cr`;
        goalLbl.textContent = "Early Level 2 credits";
        verdictEl.textContent =
          chosen.length === 0
            ? "Select 6 subjects below to see how many early Level 2 credits you can bank in Year 11."
            : `On the Springs 2-year Level 2 pathway, these ${chosen.length} subjects offer ${totalTypical} early Level 2 credits in Year 11 (${totalInt} internal, ${totalExt} external). Passing them leaves you needing ${Math.max(0, 60 - totalTypical)} more Level 2 credits in Year 12.`;
      }
    } else if (yr === "y12") {
      goalEl.textContent = `${totalTypical} / 60`;
      goalLbl.textContent = "Toward NCEA Level 2";
      const endorsable = chosen.filter((c) => c.total >= 14 && (c.exempt || (c.internal >= 3 && c.external >= 3))).length;
      if (chosen.length === 0) {
        verdictEl.textContent = "Select 6 Year 12 subjects below to calculate your Level 2 credits and UE Literacy options.";
      } else {
        verdictEl.textContent = `You are entered in roughly ${totalTypical} Level 2 credits (${totalInt} internal, ${totalExt} external) toward the 60 credits needed for NCEA Level 2. ${endorsable} of your ${chosen.length} subjects meet the 3 internal + 3 external Course Endorsement structure, and your subjects offer up to ${totalUeR} UE Reading and ${totalUeW} UE Writing credits.`;
      }
    } else {
      const ueApprovedCount = chosen.filter((c) => c.ueApproved && c.total >= 14).length;
      goalEl.textContent = `${ueApprovedCount} / 3`;
      goalLbl.textContent = "UE subjects (14+ cr)";
      if (chosen.length === 0) {
        verdictEl.textContent = "Select 5 Year 13 subjects below to check NCEA Level 3 credits and University Entrance eligibility.";
      } else {
        const ueStatus =
          ueApprovedCount >= 3
            ? `Strong UE pathway: ${ueApprovedCount} of your subjects are UE-approved with 14+ credits (minimum 3 required).`
            : `Watch out for UE: only ${ueApprovedCount} of your selected subjects are UE-approved with 14+ credits (University Entrance requires 3).`;
        verdictEl.textContent = `Your timetable offers roughly ${totalTypical} Level 3 credits (${totalInt} internal, ${totalExt} external) toward the 60 credits needed for NCEA Level 3. ${ueStatus} Available UE Literacy across these courses: ${totalUeR} Reading and ${totalUeW} Writing credits.`;
      }
    }

    const breakdown = document.getElementById("selectedBreakdown");
    if (!chosen.length) {
      breakdown.innerHTML = "";
    } else {
      breakdown.innerHTML = chosen
        .map((c) => {
          const splitText =
            c.typical !== c.total
              ? `${c.typical} typical cr (${c.total} cr menu: ${c.internal} int, ${c.external} ext)`
              : `${c.total} credits (${c.internal} internal, ${c.external} external)`;
          return `
            <div class="selected-chip">
              <div>
                <div class="selected-chip-name">${escapeHtml(c.title)}</div>
                <div class="selected-chip-meta tabular">${splitText}</div>
              </div>
              <button type="button" class="btn btn-secondary btn-sm" data-remove-id="${c.id}">Remove</button>
            </div>
          `;
        })
        .join("");

      breakdown.querySelectorAll("[data-remove-id]").forEach((btn) => {
        btn.addEventListener("click", () => {
          WSCW_STATE.selected[yr].delete(btn.getAttribute("data-remove-id"));
          renderAll();
        });
      });
    }
  };

  const renderCourseGrid = () => {
    const yr = WSCW_STATE.activeYear;
    const courses = window.WSCW_COURSES[yr] || [];
    const q = searchInput.value.trim().toLowerCase();
    const fac = facultySel.value;
    const pwy = pathwaySel.value;

    const filtered = courses.filter((c) => {
      if (fac !== "all" && c.faculty !== fac) return false;
      if (yr === "y11" && pwy !== "all" && c.pathway !== pwy) return false;
      if (!q) return true;
      const inTitle = c.title.toLowerCase().includes(q) || c.faculty.toLowerCase().includes(q) || c.note.toLowerCase().includes(q);
      const inStds = c.standards.some((s) => s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q));
      return inTitle || inStds;
    });

    const grid = document.getElementById("wscwCourseGrid");
    if (!filtered.length) {
      grid.innerHTML = `<div class="card" style="grid-column: 1 / -1; text-align: center;">No WSCW courses match your current search filter.</div>`;
      return;
    }

    grid.innerHTML = filtered
      .map((c) => {
        const isSelected = WSCW_STATE.selected[yr].has(c.id);
        const canEndorse = yr !== "y11" && c.total >= 14 && (c.exempt || (c.internal >= 3 && c.external >= 3));
        const creditDisplay = c.typical !== c.total ? `${c.typical} cr` : `${c.total} cr`;
        const creditSub = c.typical !== c.total ? `from ${c.total} offered` : `${c.internal} int, ${c.external} ext`;

        const tags = [];
        if (yr === "y11") {
          tags.push(`<span class="tag tag-neutral">${escapeHtml(c.pathway)}</span>`);
        }
        if (yr === "y13") {
          tags.push(
            c.ueApproved
              ? `<span class="tag tag-a">UE Approved</span>`
              : `<span class="tag tag-na">Not UE Approved</span>`
          );
        }
        if (c.ueRead > 0 || c.ueWrite > 0) {
          tags.push(`<span class="tag tag-m tabular">UE Lit: ${c.ueRead}R / ${c.ueWrite}W</span>`);
        }
        if (yr !== "y11" && c.exempt) {
          tags.push(`<span class="tag tag-e">Endorsement Exempt</span>`);
        } else if (yr !== "y11" && !canEndorse && c.total >= 14) {
          tags.push(`<span class="tag tag-neutral">Internal Only</span>`);
        }

        const stdRows = c.standards.length
          ? c.standards
              .map((s) => {
                const ueBits = [];
                if (s.ueR) ueBits.push("UE Reading");
                if (s.ueW) ueBits.push("UE Writing");
                const ueStr = ueBits.length ? ` (${ueBits.join(", ")})` : "";
                return `
                  <div class="std-item">
                    <div>
                      <div class="std-code">${escapeHtml(s.code)}${ueStr}</div>
                      <div class="std-name">${escapeHtml(s.name)}</div>
                    </div>
                    <div class="std-right tabular">
                      ${s.credits} cr
                      <span class="std-mode">${escapeHtml(s.mode)}</span>
                    </div>
                  </div>
                `;
              })
              .join("")
          : `<div style="font-size: 13.5px; color: var(--ink-muted);">Individualised standards confirmed with the department.</div>`;

        return `
          <article class="course-card ${isSelected ? "selected" : ""}" data-course-id="${c.id}">
            <div class="course-card-top">
              <div>
                <div class="course-faculty">${escapeHtml(c.faculty)}</div>
                <div class="course-title">${escapeHtml(c.title)}</div>
              </div>
              <div class="credit-pill tabular">
                <span class="credit-pill-num">${creditDisplay}</span>
                <span class="credit-pill-sub">${creditSub}</span>
              </div>
            </div>

            ${tags.length ? `<div class="course-meta-tags">${tags.join("")}</div>` : ""}
            <p class="course-note">${escapeHtml(c.note)}</p>

            <div class="course-actions">
              <button type="button" class="btn ${isSelected ? "btn-primary" : "btn-white"} btn-sm" data-toggle-course="${c.id}">
                ${isSelected ? "In Timetable (Remove)" : "Add to Timetable"}
              </button>
              <button type="button" class="btn btn-ghost btn-sm" data-toggle-stds="${c.id}">
                Show Standards (${c.standards.length})
              </button>
            </div>

            <div class="standards-drawer" id="stds-${c.id}">
              ${stdRows}
            </div>
          </article>
        `;
      })
      .join("");

    grid.querySelectorAll("[data-toggle-course]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-toggle-course");
        if (WSCW_STATE.selected[yr].has(id)) {
          WSCW_STATE.selected[yr].delete(id);
        } else {
          WSCW_STATE.selected[yr].add(id);
        }
        renderAll();
      });
    });

    grid.querySelectorAll("[data-toggle-stds]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-toggle-stds");
        const drawer = document.getElementById(`stds-${id}`);
        if (drawer) {
          const open = drawer.classList.toggle("open");
          btn.textContent = open
            ? "Hide Standards"
            : `Show Standards (${drawer.querySelectorAll(".std-item").length})`;
        }
      });
    });
  };

  yearBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      WSCW_STATE.activeYear = btn.getAttribute("data-year");
      searchInput.value = "";
      pathwaySel.value = "all";
      populateFacultyFilter();
      facultySel.value = "all";
      renderAll();
    });
  });

  searchInput.addEventListener("input", renderCourseGrid);
  facultySel.addEventListener("change", renderCourseGrid);
  pathwaySel.addEventListener("change", renderCourseGrid);

  loadSampleBtn.addEventListener("click", () => {
    loadTypicalForYear(WSCW_STATE.activeYear);
    renderAll();
  });

  clearBtn.addEventListener("click", () => {
    WSCW_STATE.selected[WSCW_STATE.activeYear].clear();
    renderAll();
  });

  populateFacultyFilter();
  renderAll();
}

/* --------------------------------------------------------------------------
   3. 0 to 8 Exam Marking Scale Explorer
   -------------------------------------------------------------------------- */
function initGradeScaleExplorer() {
  const descriptions = {
    N0: "<strong>N0 (0 points, No Relevant Evidence):</strong> Question left blank, or nothing written relates to the assessment criteria.",
    N1: "<strong>N1 (1 point, Minimal Evidence):</strong> A tiny fragment of relevant knowledge, well below Achieved.",
    N2: "<strong>N2 (2 points, Near Achieved):</strong> Partial understanding shown, but missed essential steps or made key errors.",
    A3: "<strong>A3 (3 points, Low Achieved):</strong> Meets the minimum criteria for Achieved on this question with minor errors or limited depth.",
    A4: "<strong>A4 (4 points, Solid Achieved):</strong> Clear, reliable demonstration of Achieved-level understanding throughout.",
    M5: "<strong>M5 (5 points, Low Merit):</strong> Shows in-depth reasoning needed for Merit, with small gaps or slight inconsistency.",
    M6: "<strong>M6 (6 points, High Merit):</strong> Strong, thorough Merit-level explanation, justification, or multi-step reasoning.",
    E7: "<strong>E7 (7 points, Low Excellence):</strong> Comprehensive, Excellence-level work on this question with minor slips or a small omission.",
    E8: "<strong>E8 (8 points, Top Excellence):</strong> Complete, perceptive, accurate mastery of every part of the question."
  };

  const btns = document.querySelectorAll("[data-scale]");
  const out = document.getElementById("scaleExplain");
  if (!out) return;

  btns.forEach((btn) => {
    btn.addEventListener("click", () => {
      btns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      out.innerHTML = descriptions[btn.getAttribute("data-scale")] || "";
    });
  });
}

/* --------------------------------------------------------------------------
   4. Certificate Endorsement Simulator
   -------------------------------------------------------------------------- */
function initCertSimulator() {
  const simE = document.getElementById("simE");
  const simM = document.getElementById("simM");
  const simA = document.getElementById("simA");
  const simRead = document.getElementById("simRead");
  const simWrite = document.getElementById("simWrite");
  const simNum = document.getElementById("simNum");
  if (!simE || !simM || !simA) return;

  let selectedLevel = 2;
  const levelBtns = document.querySelectorAll("[data-cert-level]");

  const render = () => {
    const e = Number(simE.value);
    const m = Number(simM.value);
    const a = Number(simA.value);
    const total = e + m + a;
    const mPlusE = e + m;

    const readOk = simRead.checked;
    const writeOk = simWrite.checked;
    const numOk = simNum.checked;
    const coReqCredits = (readOk ? 5 : 0) + (writeOk ? 5 : 0) + (numOk ? 10 : 0);
    const coReqOk = readOk && writeOk && numOk;
    const creditsOk = total >= 60;
    const passedCert = creditsOk && coReqOk;

    document.getElementById("simEVal").textContent = `${e} cr`;
    document.getElementById("simMVal").textContent = `${m} cr`;
    document.getElementById("simAVal").textContent = `${a} cr`;

    const scaleMax = Math.max(100, total);
    document.getElementById("simBarE").style.width = `${(e / scaleMax) * 100}%`;
    document.getElementById("simBarM").style.width = `${(m / scaleMax) * 100}%`;
    document.getElementById("simBarA").style.width = `${(a / scaleMax) * 100}%`;

    const badgeRow = document.getElementById("simBadgeRow");
    const headline = document.getElementById("simHeadline");
    const summary = document.getElementById("simSummary");

    if (!passedCert) {
      badgeRow.innerHTML = `<span class="tag tag-na">Not Yet Awarded</span>`;
      headline.textContent = `NCEA Level ${selectedLevel}: In Progress`;
      const missing = [];
      if (!creditsOk) missing.push(`${60 - total} more Level ${selectedLevel}+ subject credits`);
      if (!coReqOk) missing.push(`remaining Co-requisite standards (${20 - coReqCredits} cr)`);
      summary.textContent = `Still needed: ${missing.join(" and ")}.`;
    } else if (e >= 50) {
      badgeRow.innerHTML = `<span class="tag tag-e">Endorsed with Excellence</span>`;
      headline.textContent = `NCEA Level ${selectedLevel}: Excellence`;
      summary.textContent = `You have ${e} Excellence credits (${total} total) plus the 20-credit Co-requisite, earning the highest certificate endorsement.`;
    } else if (mPlusE >= 50) {
      badgeRow.innerHTML = `<span class="tag tag-m">Endorsed with Merit</span>`;
      headline.textContent = `NCEA Level ${selectedLevel}: Merit`;
      summary.textContent = `You have ${mPlusE} Merit and Excellence credits combined. You need ${50 - e} more Excellence credits to reach Excellence Endorsement.`;
    } else {
      badgeRow.innerHTML = `<span class="tag tag-a">NCEA Level ${selectedLevel} Achieved</span>`;
      headline.textContent = `NCEA Level ${selectedLevel}: Passed`;
      summary.textContent = `Certificate requirements met. Earn ${50 - mPlusE} more Merit or Excellence credits to reach Merit Endorsement.`;
    }

    const checks = [
      { label: `60+ credits at Level ${selectedLevel}+`, val: `${total} / 60`, ok: creditsOk },
      { label: "20-credit Co-requisite", val: `${coReqCredits} / 20`, ok: coReqOk },
      { label: "Merit endorsement (50+ M/E)", val: `${mPlusE} / 50`, ok: mPlusE >= 50 },
      { label: "Excellence endorsement (50+ E)", val: `${e} / 50`, ok: e >= 50 }
    ];

    document.getElementById("simChecklist").innerHTML = checks
      .map(
        (c) =>
          `<li><span>${c.label} (${c.val})</span><span class="${c.ok ? "status-ok" : "status-no"}">${c.ok ? "Met" : "Needed"}</span></li>`
      )
      .join("");
  };

  levelBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      levelBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      selectedLevel = Number(btn.getAttribute("data-cert-level"));
      render();
    });
  });

  [simE, simM, simA, simRead, simWrite, simNum].forEach((el) => {
    el.addEventListener("input", render);
    el.addEventListener("change", render);
  });

  render();
}

/* --------------------------------------------------------------------------
   5. Course Endorsement Tester (With Real WSCW Course Presets)
   -------------------------------------------------------------------------- */
function initCourseEndorsementTester() {
  const rowsContainer = document.getElementById("courseRows");
  const subjectTypeSel = document.getElementById("courseSubjectType");
  const presetSelect = document.getElementById("loadWscwCoursePreset");
  const addBtn = document.getElementById("addAssessmentBtn");
  const presetTrapBtn = document.getElementById("presetTrapBtn");
  if (!rowsContainer || !subjectTypeSel || !presetSelect) return;

  const allPresetCourses = [
    ...((window.WSCW_COURSES && window.WSCW_COURSES.y12) || []),
    ...((window.WSCW_COURSES && window.WSCW_COURSES.y13) || [])
  ].filter((c) => c.standards && c.standards.length > 0);

  presetSelect.innerHTML =
    `<option value="">Load a WSCW subject...</option>` +
    allPresetCourses.map((c) => `<option value="${c.id}">${escapeHtml(c.title)} (${c.total} cr)</option>`).join("");

  let assessments = [
    { name: "91153 Practical Investigation", type: "internal", credits: 4, grade: "E" },
    { name: "91154 Biological Issue", type: "internal", credits: 3, grade: "E" },
    { name: "91155 Gas Exchange", type: "internal", credits: 3, grade: "E" },
    { name: "91156 Life Processes at Cellular Level", type: "external", credits: 4, grade: "E" },
    { name: "91157 Genetic Variation and Change", type: "external", credits: 4, grade: "M" }
  ];

  const evaluate = () => {
    const isExempt = subjectTypeSel.value === "exempt";

    const totals = {
      E: { all: 0, int: 0, ext: 0 },
      ME: { all: 0, int: 0, ext: 0 },
      AME: { all: 0, int: 0, ext: 0 }
    };

    assessments.forEach((item) => {
      const cr = Math.max(0, Number(item.credits) || 0);
      const isInt = item.type === "internal";
      if (item.grade === "E") {
        totals.E.all += cr; totals.ME.all += cr; totals.AME.all += cr;
        if (isInt) { totals.E.int += cr; totals.ME.int += cr; totals.AME.int += cr; }
        else { totals.E.ext += cr; totals.ME.ext += cr; totals.AME.ext += cr; }
      } else if (item.grade === "M") {
        totals.ME.all += cr; totals.AME.all += cr;
        if (isInt) { totals.ME.int += cr; totals.AME.int += cr; }
        else { totals.ME.ext += cr; totals.AME.ext += cr; }
      } else if (item.grade === "A") {
        totals.AME.all += cr;
        if (isInt) { totals.AME.int += cr; }
        else { totals.AME.ext += cr; }
      }
    });

    const passesTier = (b) => b.all >= 14 && (isExempt || (b.int >= 3 && b.ext >= 3));

    let tier = "NONE";
    if (passesTier(totals.E)) tier = "E";
    else if (passesTier(totals.ME)) tier = "M";
    else if (passesTier(totals.AME)) tier = "A";

    const badgeEl = document.getElementById("courseBadge");
    const headlineEl = document.getElementById("courseHeadline");
    const diagEl = document.getElementById("courseDiagnosis");

    if (tier === "E") {
      badgeEl.innerHTML = `<span class="tag tag-e">Course Endorsed with Excellence</span>`;
      headlineEl.textContent = "Endorsed with Excellence";
      diagEl.textContent = isExempt
        ? `You have ${totals.E.all} Excellence credits in a single year (3+3 rule exempt for this course).`
        : `You have ${totals.E.all} Excellence credits (${totals.E.int} Internal, ${totals.E.ext} External) in one year.`;
    } else if (tier === "M") {
      badgeEl.innerHTML = `<span class="tag tag-m">Course Endorsed with Merit</span>`;
      headlineEl.textContent = "Endorsed with Merit";
      if (!isExempt && totals.E.all >= 14 && (totals.E.int < 3 || totals.E.ext < 3)) {
        diagEl.textContent = `You have ${totals.E.all} Excellence credits, but only ${totals.E.int} Internal E and ${totals.E.ext} External E (both must be at least 3). Your Merit + Excellence split still earns Merit Endorsement.`;
      } else {
        diagEl.textContent = `You meet the Merit criteria with ${totals.ME.all} Merit/Excellence credits (${totals.ME.int} Internal, ${totals.ME.ext} External).`;
      }
    } else if (tier === "A") {
      badgeEl.innerHTML = `<span class="tag tag-a">Course Endorsed with Achieved</span>`;
      headlineEl.textContent = "Endorsed with Achieved";
      diagEl.textContent = `You have ${totals.AME.all} passed credits (${totals.AME.int} Internal, ${totals.AME.ext} External), qualifying for Achieved Course Endorsement.`;
    } else {
      badgeEl.innerHTML = `<span class="tag tag-na">No Course Endorsement</span>`;
      headlineEl.textContent = "Not Yet Endorsed";
      if (totals.AME.all >= 14 && !isExempt) {
        diagEl.textContent = `You have ${totals.AME.all} passed credits, but you do not meet the 3 Internal + 3 External split (${totals.AME.int} Internal, ${totals.AME.ext} External).`;
      } else {
        diagEl.textContent = `You currently have ${totals.AME.all} passed credits. At least 14 credits in one calendar year are required.`;
      }
    }

    const checks = [
      { label: `Excellence tier (${totals.E.all} cr: ${totals.E.int} int, ${totals.E.ext} ext)`, ok: passesTier(totals.E) },
      { label: `Merit tier (${totals.ME.all} cr: ${totals.ME.int} int, ${totals.ME.ext} ext)`, ok: passesTier(totals.ME) },
      { label: `Achieved tier (${totals.AME.all} cr: ${totals.AME.int} int, ${totals.AME.ext} ext)`, ok: passesTier(totals.AME) }
    ];

    document.getElementById("courseChecklist").innerHTML = checks
      .map((c) => `<li><span>${c.label}</span><span class="${c.ok ? "status-ok" : "status-no"}">${c.ok ? "Met" : "Not Met"}</span></li>`)
      .join("");
  };

  const renderRows = () => {
    rowsContainer.innerHTML = "";
    assessments.forEach((item, idx) => {
      const row = document.createElement("div");
      row.className = "row-grid-course";
      row.innerHTML = `
        <input type="text" class="input" value="${escapeHtml(item.name)}" aria-label="Standard name" data-field="name" />
        <select class="select" aria-label="Type" data-field="type">
          <option value="internal" ${item.type === "internal" ? "selected" : ""}>Internal</option>
          <option value="external" ${item.type === "external" ? "selected" : ""}>External</option>
        </select>
        <input type="number" class="input tabular" min="1" max="20" value="${item.credits}" aria-label="Credits" data-field="credits" />
        <select class="select" aria-label="Grade" data-field="grade">
          <option value="E" ${item.grade === "E" ? "selected" : ""}>Excellence</option>
          <option value="M" ${item.grade === "M" ? "selected" : ""}>Merit</option>
          <option value="A" ${item.grade === "A" ? "selected" : ""}>Achieved</option>
          <option value="NA" ${item.grade === "NA" ? "selected" : ""}>Not Achieved</option>
        </select>
        <button type="button" class="btn btn-ghost btn-sm" data-rm="${idx}">Remove</button>
      `;

      row.querySelectorAll("[data-field]").forEach((inp) => {
        const update = () => {
          const f = inp.getAttribute("data-field");
          assessments[idx][f] = f === "credits" ? Number(inp.value) : inp.value;
          evaluate();
        };
        inp.addEventListener("input", update);
        inp.addEventListener("change", update);
      });

      row.querySelector("[data-rm]").addEventListener("click", () => {
        if (assessments.length > 1) {
          assessments.splice(idx, 1);
          renderRows();
        }
      });

      rowsContainer.appendChild(row);
    });
    evaluate();
  };

  presetSelect.addEventListener("change", () => {
    const id = presetSelect.value;
    if (!id) return;
    const found = allPresetCourses.find((c) => c.id === id);
    if (!found) return;
    subjectTypeSel.value = found.exempt ? "exempt" : "standard";
    assessments = found.standards.slice(0, 8).map((s) => ({
      name: `${s.code} ${s.name.slice(0, 32)}`,
      type: s.mode.toLowerCase() === "external" ? "external" : "internal",
      credits: s.credits,
      grade: "E"
    }));
    renderRows();
  });

  addBtn.addEventListener("click", () => {
    assessments.push({ name: `Standard ${assessments.length + 1}`, type: "internal", credits: 4, grade: "M" });
    renderRows();
  });

  presetTrapBtn.addEventListener("click", () => {
    presetSelect.value = "";
    subjectTypeSel.value = "standard";
    assessments = [
      { name: "Internal 1 (Writing)", type: "internal", credits: 6, grade: "E" },
      { name: "Internal 2 (Connections)", type: "internal", credits: 4, grade: "E" },
      { name: "Internal 3 (Research)", type: "internal", credits: 4, grade: "E" },
      { name: "External Exam (Written Text)", type: "external", credits: 4, grade: "M" }
    ];
    renderRows();
  });

  subjectTypeSel.addEventListener("change", evaluate);
  renderRows();
}

/* --------------------------------------------------------------------------
   6. University Entrance & Rank Score Calculator
   -------------------------------------------------------------------------- */
let setUeSubjectsExternal = null;

function importSelectedY13IntoRankCalculator() {
  if (!setUeSubjectsExternal || !window.WSCW_COURSES) return;
  const allY13 = window.WSCW_COURSES.y13 || [];
  const picked = allY13.filter((c) => WSCW_STATE.selected.y13.has(c.id) && c.ueApproved).slice(0, 5);
  if (!picked.length) return;

  const mapped = picked.map((c) => {
    const cr = Math.min(c.typical, 24);
    const e = Math.round(cr * 0.5);
    const m = Math.round(cr * 0.35);
    const a = Math.max(0, cr - e - m);
    return { name: c.title.replace(/^Level 3\s+/i, ""), e, m, a };
  });

  while (mapped.length < 5) {
    mapped.push({ name: `Approved Subject ${mapped.length + 1}`, e: 0, m: 0, a: 0 });
  }
  setUeSubjectsExternal(mapped);
}

function initUeRankCalculator() {
  const container = document.getElementById("ueSubjectRows");
  const ueL3 = document.getElementById("ueL3");
  const ueLit = document.getElementById("ueLit");
  const ueNum = document.getElementById("ueNum");
  const resetBtn = document.getElementById("resetUeBtn");
  const importBtn = document.getElementById("importY13Btn");
  if (!container) return;

  const defaultSubjects = () => [
    { name: "English & Te Reo Pakeha", e: 12, m: 6, a: 0 },
    { name: "Calculus", e: 10, m: 8, a: 0 },
    { name: "Biology", e: 9, m: 9, a: 0 },
    { name: "Chemistry", e: 9, m: 6, a: 4 },
    { name: "Economics", e: 6, m: 10, a: 4 }
  ];

  let subjects = defaultSubjects();

  const calculate = () => {
    let poolE = 0;
    let poolM = 0;
    let poolA = 0;
    let approvedSubjects14Plus = 0;

    subjects.forEach((s, idx) => {
      const e = Math.max(0, Math.floor(Number(s.e) || 0));
      const m = Math.max(0, Math.floor(Number(s.m) || 0));
      const a = Math.max(0, Math.floor(Number(s.a) || 0));
      const rawTotal = e + m + a;
      if (rawTotal >= 14) approvedSubjects14Plus++;

      const capE = Math.min(e, 24);
      const capM = Math.min(m, 24 - capE);
      const capA = Math.min(a, 24 - capE - capM);
      const cappedTotal = capE + capM + capA;

      poolE += capE;
      poolM += capM;
      poolA += capA;

      const capCell = container.querySelector(`[data-cap-idx="${idx}"]`);
      if (capCell) {
        capCell.textContent = rawTotal > 24 ? `${cappedTotal} (cap)` : `${cappedTotal} cr`;
      }
    });

    const usedE = Math.min(poolE, 80);
    const usedM = Math.min(poolM, 80 - usedE);
    const usedA = Math.min(poolA, 80 - usedE - usedM);
    const usedTotal = usedE + usedM + usedA;
    const rankScore = usedE * 4 + usedM * 3 + usedA * 2;

    const l3Ok = ueL3.checked;
    const litOk = ueLit.checked;
    const numOk = ueNum.checked;
    const subjectsOk = approvedSubjects14Plus >= 3;
    const hasUE = l3Ok && litOk && numOk && subjectsOk;

    document.getElementById("ueRankScore").textContent = String(rankScore);
    document.getElementById("ueCreditSummary").textContent =
      `Best ${usedTotal} of 80 Level 3 credits counted (${usedE} E x 4 + ${usedM} M x 3 + ${usedA} A x 2)`;

    document.getElementById("ueStatusBadge").innerHTML = hasUE
      ? `<span class="tag tag-a">University Entrance Met</span>`
      : `<span class="tag tag-na">UE Requirements Incomplete</span>`;

    const checks = [
      { label: "NCEA Level 3 (60+ cr + Co-req)", ok: l3Ok },
      { label: `3 approved subjects with 14+ cr (${approvedSubjects14Plus} of 3)`, ok: subjectsOk },
      { label: "UE Literacy (5 Reading + 5 Writing at L2+)", ok: litOk },
      { label: "UE Numeracy (10 cr at L1+)", ok: numOk }
    ];

    document.getElementById("ueChecklist").innerHTML = checks
      .map((c) => `<li><span>${c.label}</span><span class="${c.ok ? "status-ok" : "status-no"}">${c.ok ? "Met" : "Needed"}</span></li>`)
      .join("");

    const bench = document.getElementById("ueBenchmarks");
    if (!hasUE) {
      bench.textContent = "Complete all 4 UE requirements above to qualify for direct entry into a New Zealand university degree.";
    } else if (rankScore >= 280) {
      bench.textContent = "280+ Rank Score: competitive for nearly all New Zealand degrees (including Biomedical Science and Engineering) and major entrance scholarships.";
    } else if (rankScore >= 250) {
      bench.textContent = "250 to 279 Rank Score: clears guaranteed entry for most competitive degrees nationwide (check specific Calculus, Physics, or portfolio requirements).";
    } else if (rankScore >= 180) {
      bench.textContent = "180 to 249 Rank Score: clears guaranteed entry for most Bachelor of Arts, Science, Commerce, and Design programmes.";
    } else {
      bench.textContent = "Standard UE range: qualifies for general Bachelor's programmes across most New Zealand universities.";
    }
  };

  const renderRows = () => {
    container.innerHTML = "";
    subjects.forEach((subj, idx) => {
      const row = document.createElement("div");
      row.className = "row-grid-ue";
      row.innerHTML = `
        <input type="text" class="input" value="${escapeHtml(subj.name)}" aria-label="Subject ${idx + 1}" data-f="name" />
        <input type="number" class="input tabular" min="0" max="36" value="${subj.e}" aria-label="Excellence credits" data-f="e" />
        <input type="number" class="input tabular" min="0" max="36" value="${subj.m}" aria-label="Merit credits" data-f="m" />
        <input type="number" class="input tabular" min="0" max="36" value="${subj.a}" aria-label="Achieved credits" data-f="a" />
        <span class="tabular" style="font-size: 13px; color: var(--ink-muted);" data-cap-idx="${idx}">0 cr</span>
      `;

      row.querySelectorAll("[data-f]").forEach((inp) => {
        inp.addEventListener("input", () => {
          const f = inp.getAttribute("data-f");
          subjects[idx][f] = f === "name" ? inp.value : Number(inp.value);
          calculate();
        });
      });

      container.appendChild(row);
    });
    calculate();
  };

  setUeSubjectsExternal = (newSubjects) => {
    subjects = newSubjects;
    renderRows();
  };

  [ueL3, ueLit, ueNum].forEach((cb) => cb.addEventListener("change", calculate));

  resetBtn.addEventListener("click", () => {
    subjects = defaultSubjects();
    ueL3.checked = true;
    ueLit.checked = true;
    ueNum.checked = true;
    renderRows();
  });

  importBtn.addEventListener("click", () => {
    importSelectedY13IntoRankCalculator();
  });

  renderRows();
}

/* --------------------------------------------------------------------------
   7. Accordions (Rules & Policies)
   -------------------------------------------------------------------------- */
function initAccordions() {
  document.querySelectorAll(".faq-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const item = btn.closest(".faq-item");
      const open = item.classList.toggle("open");
      btn.setAttribute("aria-expanded", String(open));
      const word = btn.querySelector(".faq-toggle-word");
      if (word) word.textContent = open ? "Hide" : "Show";
    });
  });
}

/* --------------------------------------------------------------------------
   8. Searchable NCEA Glossary
   -------------------------------------------------------------------------- */
const GLOSSARY_ITEMS = [
  { term: "Achievement Standard (AS)", cat: "core", def: "Curriculum-based standard graded Not Achieved, Achieved, Merit, or Excellence. Counts toward NCEA, endorsements, and University Entrance." },
  { term: "CAA (Common Assessment Activity)", cat: "assessment", def: "Online external tests sat at school (typically Term 2 and Term 3) to assess the 20-credit Literacy and Numeracy Co-requisite." },
  { term: "Certificate Endorsement", cat: "pathway", def: "Recognition on an NCEA Level 1, 2, or 3 certificate for 50+ Excellence credits (Excellence) or 50+ Merit and Excellence credits combined (Merit). Can be earned over multiple years." },
  { term: "Co-Requisite (Literacy and Numeracy)", cat: "core", def: "Mandatory one-off 20-credit requirement (5 Reading, 5 Writing, 10 Numeracy) sitting outside your 60 subject credits, needed for any NCEA certificate." },
  { term: "Course Endorsement", cat: "pathway", def: "Subject-level honour for 14+ credits in one course in a single year (Achieved, Merit, or Excellence), with at least 3 internal and 3 external credits at that grade (unless exempt)." },
  { term: "Credit", cat: "core", def: "A measure of learning volume (roughly 10 hours per credit). Passing a standard at A, M, or E permanently awards all of its credits." },
  { term: "Cut Score", cat: "assessment", def: "The annual score boundary (usually out of 24 across three 0 to 8 questions) set by NZQA to separate NA, A, M, and E on an external exam." },
  { term: "Derived Grade", cat: "assessment", def: "An external exam grade awarded from verified school mock exam evidence if illness, injury, or bereavement prevents you sitting a November exam." },
  { term: "External Assessment", cat: "assessment", def: "Assessments marked independently by NZQA markers, including November exams, digital assessments, and submitted Art or Technology portfolios." },
  { term: "FAO (Further Assessment Opportunity)", cat: "assessment", def: "A brand-new second assessment task for an internal standard after further teaching (max 1 per standard per year if offered). Can earn up to Excellence." },
  { term: "Internal Assessment", cat: "assessment", def: "Coursework assessed at school during the year (essays, experiments, speeches, practicals) and marked by teachers under NZQA moderation." },
  { term: "Moderation", cat: "assessment", def: "NZQA's national quality check where independent moderators verify samples of school-marked internal assessments to keep standards consistent across NZ." },
  { term: "NSN (National Student Number)", cat: "core", def: "Your unique 9-digit New Zealand education ID used for the NZQA Learner Portal, exams, and your Record of Achievement." },
  { term: "NZQA", cat: "core", def: "New Zealand Qualifications Authority, the organisation that runs NCEA, external exams, moderation, UE, and NZ Scholarship." },
  { term: "Rank Score", cat: "pathway", def: "Score out of 320 used by NZ universities for competitive entry: best 80 Level 3 credits across up to 5 UE-approved subjects (max 24 credits per subject; E=4, M=3, A=2)." },
  { term: "Record of Achievement (ROA)", cat: "core", def: "Your official NZQA academic transcript showing all passed standards, credits, endorsements, and qualifications." },
  { term: "Reconsideration vs Review", cat: "assessment", def: "A Review (free) checks clerical and addition errors on an exam paper; a Reconsideration (small fee) gets a senior marker to completely re-mark your paper." },
  { term: "Resubmission", cat: "assessment", def: "A single opportunity on an internal assessment to fix a small error when on the NA/Achieved boundary. Highest possible grade is Achieved." },
  { term: "SAC (Special Assessment Conditions)", cat: "assessment", def: "Approved assessment support (extra time, reader/writer, computer, separate room) for students with diagnosed learning, sensory, or medical barriers." },
  { term: "Te Reo Matatini and Pāngarau", cat: "core", def: "Māori-medium literacy (32413, 32415) and numeracy (32412) standards that meet the 20-credit NCEA Co-requisite." },
  { term: "Unit Standard (US)", cat: "core", def: "Practical or vocational standard usually graded Achieved or Not Achieved only. Counts toward your 60 NCEA credits." },
  { term: "University Entrance (UE)", cat: "pathway", def: "Minimum requirement for NZ university degree entry: NCEA Level 3, 14 Level 3 credits in 3 approved subjects, UE Literacy (5R + 5W at L2+), and UE Numeracy (10 cr L1+)." },
  { term: "Vocational Pathways", cat: "pathway", def: "Six industry-aligned Level 2 awards earned by gaining 60 recommended Level 2 credits (including at least 20 sector-related credits)." }
];

function initGlossary() {
  const grid = document.getElementById("glossaryGrid");
  const search = document.getElementById("glossarySearch");
  const catBtns = document.querySelectorAll("[data-gloss-cat]");
  if (!grid || !search) return;

  let activeCat = "all";

  const render = () => {
    const q = search.value.trim().toLowerCase();
    const filtered = GLOSSARY_ITEMS.filter((item) => {
      const catOk = activeCat === "all" || item.cat === activeCat;
      const textOk = !q || item.term.toLowerCase().includes(q) || item.def.toLowerCase().includes(q);
      return catOk && textOk;
    });

    if (!filtered.length) {
      grid.innerHTML = `<div class="card" style="grid-column: 1 / -1; text-align: center;">No terms match "${escapeHtml(search.value)}".</div>`;
      return;
    }

    grid.innerHTML = filtered
      .map(
        (item) => `
        <div class="glossary-item">
          <h4>${escapeHtml(item.term)}</h4>
          <p>${escapeHtml(item.def)}</p>
        </div>`
      )
      .join("");
  };

  search.addEventListener("input", render);
  catBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      catBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      activeCat = btn.getAttribute("data-gloss-cat");
      render();
    });
  });

  render();
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
