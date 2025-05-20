document.addEventListener('DOMContentLoaded', function() {
  const subtitlesList = document.getElementById('subtitles-list');
  const noSubtitlesMessage = document.getElementById('no-subtitles');
  const clearBtn = document.getElementById('clear-btn');

  // Load subtitles from background script memory
  function loadSubtitles() {
    chrome.runtime.sendMessage({ action: "getSubtitles" }, function(response) {
      const subtitles = response.subtitles || [];

      if (subtitles.length === 0) {
        subtitlesList.innerHTML = '';
        noSubtitlesMessage.classList.remove('hidden');
      } else {
        noSubtitlesMessage.classList.add('hidden');
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
      name.textContent = subtitle.fileName;

      const ext = document.createElement('div');
      ext.className = 'subtitle-also';
      ext.textContent = new Date(subtitle.timestamp).toLocaleString();

      info.appendChild(name);
      info.appendChild(ext);

      const downloadBtn = document.createElement('a');
      downloadBtn.className = 'download-btn';
      downloadBtn.textContent = 'Download';
      downloadBtn.href = subtitle.url;
      downloadBtn.target = '_blank';
      downloadBtn.download = '';

      item.appendChild(info);
      item.appendChild(downloadBtn);
      subtitlesList.appendChild(item);
    });
  }

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
