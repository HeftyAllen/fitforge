// assets/js/log-entry.js
document.addEventListener('DOMContentLoaded', () => {
  const logTypeInputs = Array.from(document.querySelectorAll('.log-type-input'));
  const sections = {
    measurements: document.getElementById('measurements-section'),
    strength: document.getElementById('strength-section'),
    performance: document.getElementById('performance-section'),
    photos: document.getElementById('photos-section')
  };

  const form = document.getElementById('progress-form');
  const sectionTitleNode = document.querySelector('#progress-form .section-title') || null;

  // Create a small hint area under "Log Details" for contextual tips (inserted just once)
  const logDetailsSection = document.querySelector('.form-section:nth-of-type(2)'); // "Log Details" section (2nd section)
  let hintEl;
  if (logDetailsSection) {
    hintEl = document.createElement('div');
    hintEl.className = 'log-detail-hint';
    hintEl.style.margin = '8px 0 16px';
    hintEl.style.color = 'var(--text-tertiary)';
    logDetailsSection.appendChild(hintEl);
  }

  function hideAllSections() {
    Object.values(sections).forEach(sec => {
      if (!sec) return;
      sec.style.display = 'none';
      // remove all required attributes in hidden sections
      sec.querySelectorAll('input, select, textarea').forEach(el => el.required = false);
    });
  }

  function showSection(type) {
    hideAllSections();
    const sec = sections[type];
    if (!sec) return;
    sec.style.display = '';
    // set required for visible inputs lightly (only top-level inputs, not optional checkboxes)
    sec.querySelectorAll('input, select, textarea').forEach(el => {
      // We don't force files or optional notes to be required
      if (el.type === 'file' || el.type === 'checkbox' || el.tagName.toLowerCase() === 'textarea') {
        el.required = false;
      } else {
        // only mark field required if it has a name and is visible
        if (el.name) el.required = true;
      }
    });

    // update hint text
    if (hintEl) {
      switch (type) {
        case 'measurements':
          hintEl.textContent = 'Record accurate measurements using the same units each time to get consistent progress tracking.';
          break;
        case 'strength':
          hintEl.textContent = 'Select an exercise or type your own. For one-rep max style PRs, record weight and reps.';
          break;
        case 'performance':
          hintEl.textContent = 'For running, record duration and distance. Use the Beep Test option to log level/completion.';
          break;
        case 'photos':
          hintEl.textContent = 'Upload front/side/back photos. Keep consistent lighting and distance between updates.';
          break;
        default:
          hintEl.textContent = '';
      }
    }
  }

  // wire the radio buttons to show relevant sections
  logTypeInputs.forEach(input => {
    input.addEventListener('change', (e) => {
      if (!e.target.checked) return;
      showSection(e.target.value);
    });
  });

  // initialize based on checked radio
  const initial = logTypeInputs.find(i => i.checked) || logTypeInputs[0];
  if (initial) showSection(initial.value);

  // ------------ Strength helpers (common exercises dropdown + duplicate PRs) ------------
  const strengthSection = sections.strength;
  if (strengthSection) {
    const exerciseName = strengthSection.querySelector('#exercise-name');
    const addAnotherBtn = document.getElementById('add-another-pr');

    // If there isn't a select, create one above the exercise input
    let exerciseSelect = strengthSection.querySelector('#exercise-select');
    if (!exerciseSelect) {
      exerciseSelect = document.createElement('select');
      exerciseSelect.id = 'exercise-select';
      exerciseSelect.className = 'form-select';
      exerciseSelect.style.marginBottom = '10px';
      const placeholderOpt = document.createElement('option');
      placeholderOpt.value = '';
      placeholderOpt.textContent = 'Choose common exercise (or type your own)';
      exerciseSelect.appendChild(placeholderOpt);

      const common = [
        'Bench Press',
        'Squat',
        'Deadlift',
        'Overhead Press',
        'Barbell Row',
        'Pull-up',
        'Dip',
        'Leg Press',
        'Romanian Deadlift',
        'Shoulder Press'
      ];
      common.forEach(name => {
        const opt = document.createElement('option');
        opt.value = name;
        opt.textContent = name;
        exerciseSelect.appendChild(opt);
      });

      // insert the select right before the exercise-name input
      exerciseName.parentNode.insertBefore(exerciseSelect, exerciseName);
    }

    exerciseSelect.addEventListener('change', () => {
      if (exerciseSelect.value) {
        exerciseName.value = exerciseSelect.value;
      }
    });

    // duplicate PR block when user clicks Add Another PR
    if (addAnotherBtn) {
      addAnotherBtn.addEventListener('click', () => {
        const prGrid = strengthSection.querySelector('.strength-grid');
        const clone = document.createElement('div');
        clone.className = 'pr-duplicate';
        const timestamp = Date.now();

        clone.innerHTML = `
          <div class="form-group">
            <label class="form-label">Exercise</label>
            <input type="text" name="exerciseName_${timestamp}" class="form-input" placeholder="e.g., Bench Press">
          </div>
          <div class="form-group">
            <label class="form-label">Weight</label>
            <div class="input-with-unit">
              <input type="number" name="prWeight_${timestamp}" class="form-input" placeholder="0">
              <span class="input-unit">lbs</span>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Reps</label>
            <input type="number" name="prReps_${timestamp}" class="form-input" placeholder="0">
          </div>
          <div class="form-group">
            <label class="form-label">PR Notes</label>
            <textarea name="prNotes_${timestamp}" class="form-textarea" rows="2"></textarea>
          </div>
          <button type="button" class="btn btn-secondary remove-pr" style="align-self:flex-start; margin-top:6px;">Remove</button>
        `;
        prGrid.appendChild(clone);

        // wire remove button
        clone.querySelector('.remove-pr').addEventListener('click', () => clone.remove());
      });
    }
  }

  // ------------ Performance helpers (dynamic beep test input + activity-based adjustments) ------------
  const performanceSection = sections.performance;
  if (performanceSection) {
    const activityType = performanceSection.querySelector('#activity-type');
    const distanceInput = performanceSection.querySelector('#distance');
    const durationInput = performanceSection.querySelector('#duration');
    const paceInput = performanceSection.querySelector('#pace');

    // add a small sub-select for running type (time trial vs beep test) when running selected
    const runningSubWrapper = document.createElement('div');
    runningSubWrapper.style.marginTop = '8px';
    runningSubWrapper.style.display = 'none';
    runningSubWrapper.innerHTML = `
      <label class="form-label" for="running-style">Running mode</label>
      <select id="running-style" class="form-select">
        <option value="">Select running mode</option>
        <option value="road">Road / Track (distance & time)</option>
        <option value="beep">Beep Test (level achieved)</option>
        <option value="time-trial">Time Trial (duration for set distance)</option>
      </select>
      <div id="beep-level-row" style="margin-top:10px; display:none;">
        <label class="form-label">Beep Test Level</label>
        <input type="text" id="beep-level" name="beepLevel" class="form-input" placeholder="e.g., Level 7.5">
      </div>
    `;
    // append below activityType
    activityType.parentNode.appendChild(runningSubWrapper);
    const runningStyle = runningSubWrapper.querySelector('#running-style');
    const beepLevelRow = runningSubWrapper.querySelector('#beep-level-row');

    activityType.addEventListener('change', (e) => {
      const val = e.target.value;
      // show running subselect only when running selected
      if (val === 'running') {
        runningSubWrapper.style.display = '';
      } else {
        runningSubWrapper.style.display = 'none';
        runningStyle.value = '';
        beepLevelRow.style.display = 'none';
        // re-enable default fields
        distanceInput.closest('.form-group').style.display = '';
        durationInput.closest('.form-group').style.display = '';
        paceInput.closest('.form-group').style.display = '';
      }

      if (val === 'cycling' || val === 'swimming' || val === 'other') {
        // for these, ensure distance/duration/pace are visible
        distanceInput.closest('.form-group').style.display = '';
        durationInput.closest('.form-group').style.display = '';
        paceInput.closest('.form-group').style.display = '';
      }
    });

    runningStyle.addEventListener('change', (evt) => {
      const val = evt.target.value;
      if (val === 'beep') {
        // hide distance/pace, show beep level
        distanceInput.closest('.form-group').style.display = 'none';
        paceInput.closest('.form-group').style.display = 'none';
        beepLevelRow.style.display = '';
        // make beep-level required
        beepLevelRow.querySelector('#beep-level').required = true;
      } else {
        // show default fields
        distanceInput.closest('.form-group').style.display = '';
        paceInput.closest('.form-group').style.display = '';
        beepLevelRow.style.display = 'none';
        const beepInput = beepLevelRow.querySelector('#beep-level');
        if (beepInput) beepInput.required = false;
      }
    });
  }

  // ------------ Photo upload: clickable area + preview thumbnails ------------
  const photosSection = sections.photos;
  if (photosSection) {
    const uploadArea = photosSection.querySelector('.photo-upload-area');
    const fileInput = photosSection.querySelector('#progress-photos');

    // create preview container
    let previewWrap = photosSection.querySelector('.photo-previews');
    if (!previewWrap) {
      previewWrap = document.createElement('div');
      previewWrap.className = 'photo-previews';
      previewWrap.style.display = 'grid';
      previewWrap.style.gridTemplateColumns = 'repeat(auto-fit, minmax(120px, 1fr))';
      previewWrap.style.gap = '12px';
      previewWrap.style.marginTop = '12px';
      uploadArea.parentNode.insertBefore(previewWrap, fileInput.nextSibling);
    }

    // clicking upload area triggers file input
    uploadArea.addEventListener('click', () => fileInput.click());

    // drag and drop support
    uploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadArea.style.opacity = 0.92;
    });
    uploadArea.addEventListener('dragleave', () => {
      uploadArea.style.opacity = '';
    });
    uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadArea.style.opacity = '';
      const files = Array.from(e.dataTransfer.files || []);
      if (files.length) {
        fileInput.files = createFileList(files);
        showPreviews(files, previewWrap);
      }
    });

    fileInput.addEventListener('change', (e) => {
      const files = Array.from(e.target.files || []);
      showPreviews(files, previewWrap);
    });

    function showPreviews(files, container) {
      container.innerHTML = '';
      files.forEach(file => {
        if (!file.type.startsWith('image/')) return;
        const reader = new FileReader();
        const thumb = document.createElement('div');
        thumb.className = 'photo-thumb';
        thumb.style.border = '1px solid var(--border-primary)';
        thumb.style.borderRadius = '6px';
        thumb.style.padding = '6px';
        thumb.style.background = 'var(--surface-secondary)';
        thumb.style.display = 'flex';
        thumb.style.flexDirection = 'column';
        thumb.style.alignItems = 'center';
        thumb.style.justifyContent = 'center';
        thumb.style.minHeight = '100px';
        thumb.style.overflow = 'hidden';
        reader.onload = function(evt) {
          const img = document.createElement('img');
          img.src = evt.target.result;
          img.style.maxWidth = '100%';
          img.style.maxHeight = '90px';
          img.style.objectFit = 'cover';
          img.alt = file.name;
          const label = document.createElement('div');
          label.textContent = file.name.split('.').slice(0, -1).join('.') || file.name;
          label.style.fontSize = '12px';
          label.style.marginTop = '6px';
          label.style.textAlign = 'center';
          label.style.color = 'var(--text-tertiary)';
          thumb.appendChild(img);
          thumb.appendChild(label);
        };
        reader.readAsDataURL(file);
        container.appendChild(thumb);
      });
    }

    // small helper to convert array of files to DataTransfer FileList for assigning to input.files
    function createFileList(files) {
      const dt = new DataTransfer();
      files.forEach(f => dt.items.add(f));
      return dt.files;
    }
  }

  // Prevent the form from submitting while testing (remove/change as needed)
  form.addEventListener('submit', (ev) => {
    // basic client-side check: if any required visible inputs are empty, stop
    const visibleRequired = Array.from(form.querySelectorAll('input[required], select[required], textarea[required]')).filter(el => {
      return el.offsetParent !== null; // visible
    });
    const missing = visibleRequired.find(el => !el.value);
    if (missing) {
      ev.preventDefault();
      missing.focus();
      alert('Please fill required fields for the selected log type before saving.');
    } else {
      // allow submission in production. If you want to keep demo blocking, uncomment:
      // ev.preventDefault();
      // alert('Form ready to submit (demo).');
    }
  });

});
