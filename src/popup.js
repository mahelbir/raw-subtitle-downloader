document.addEventListener('DOMContentLoaded', function() {
  const subtitlesList = document.getElementById('subtitles-list');
  const noSubtitlesMessage = document.getElementById('no-subtitles');
  const clearBtn = document.getElementById('clear-btn');
  const downloadAllBtn = document.getElementById('download-all-btn');
  let currentSubtitles = [];

  // Load subtitles from background script memory
  function loadSubtitles() {
    chrome.runtime.sendMessage({ action: "getSubtitles" }, function(response) {
      const subtitles = response.subtitles || [];
      currentSubtitles = subtitles;

      if (subtitles.length === 0) {
        subtitlesList.innerHTML = '';
        noSubtitlesMessage.classList.remove('hidden');
        downloadAllBtn.classList.add('hidden');
      } else {
        noSubtitlesMessage.classList.add('hidden');
        downloadAllBtn.classList.toggle('hidden', subtitles.length < 2);
        renderSubtitlesList(subtitles);
      }
    });
  }

  // Render the list of subtitles
  function renderSubtitlesList(subtitles) {
    // Sort by most recent first
    subtitles.sort((a, b) => b.timestamp - a.timestamp);

    subtitlesList.innerHTML = '';

    subtitles.forEach(subtitle => {
      const item = document.createElement('div');
      item.className = 'subtitle-item';

      const info = document.createElement('div');
      info.className = 'subtitle-info';

      const name = document.createElement('div');
      name.className = 'subtitle-name';
      const maxNameLength = 40;
      const fullName = subtitle.fileName;
      const truncated = fullName.length > maxNameLength;
      name.textContent = truncated ? fullName.slice(0, maxNameLength) + '...' : fullName;
      if (truncated) item.title = fullName;

      const ext = document.createElement('div');
      ext.className = 'subtitle-also';
      ext.textContent = new Date(subtitle.timestamp).toLocaleString();

      info.appendChild(name);
      info.appendChild(ext);

      const downloadBtn = document.createElement('button');
      downloadBtn.className = 'download-btn';
      downloadBtn.textContent = 'Download';
      downloadBtn.title = fullName;
      downloadBtn.addEventListener('click', () => downloadSubtitle(subtitle));

      const removeBtn = document.createElement('button');
      removeBtn.className = 'remove-btn';
      removeBtn.textContent = '×';
      removeBtn.title = 'Remove';
      removeBtn.addEventListener('click', () => removeSubtitle(subtitle.url));

      item.appendChild(info);
      item.appendChild(downloadBtn);
      item.appendChild(removeBtn);
      subtitlesList.appendChild(item);
    });
  }

  function downloadSubtitle(subtitle) {
    chrome.downloads.download({
      url: subtitle.url,
      filename: subtitle.fileName
    });
  }

  function removeSubtitle(url) {
    chrome.runtime.sendMessage({ action: "removeSubtitle", url: url }, function(response) {
      if (response && response.success) {
        loadSubtitles();
      }
    });
  }

  downloadAllBtn.addEventListener('click', function() {
    currentSubtitles.forEach(downloadSubtitle);
  });

  // Clear all subtitles
  clearBtn.addEventListener('click', function() {
    chrome.runtime.sendMessage({ action: "clearSubtitles" }, function(response) {
      if (response.success) {
        loadSubtitles();
      }
    });
  });

  // Initial load
  loadSubtitles();

  // Poll for updates regularly
  setInterval(loadSubtitles, 1000);
});
