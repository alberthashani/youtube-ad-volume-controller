// ==UserScript==
// @name         YouTube Ad Volume Controller
// @namespace    https://github.com/alberthashani/youtube-ad-volume-controller
// @version      1.0
// @description  Automatically mutes YouTube ads and restores volume when they end
// @author       Albert Hashani
// @match        https://www.youtube.com/*
// @match        https://m.youtube.com/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';
    
    // Configuration
    const AD_VOLUME = 0.0; // Volume during ads (0.0 = muted, 0.05 = very low)
    const CHECK_INTERVAL = 100; // How often to check for ads (milliseconds)
    
    // State variables
    let playerElement = null;
    let adPlaying = false;
    let savedVolume = null;
    let savedMuted = null;
    let lastKnownUserVolume = null;
    let checkInterval = null;
    let isDebugMode = false; // Set to true for verbose logging
    
    // Utility functions
    function log(message) {
        if (isDebugMode) {
            console.log('[YouTube Ad Volume Controller]', message);
        }
    }
    
    function setVolume(videoPlayer, volume) {
        if (!videoPlayer) return;
        
        videoPlayer.volume = volume;
        
        // Dispatch input event to trigger YouTube's volume UI updates
        const event = new Event('input', { bubbles: true });
        videoPlayer.dispatchEvent(event);
    }
    
    function saveCurrentVolumeState(videoPlayer) {
        if (!videoPlayer || savedVolume !== null) return;
        
        // Use lastKnownUserVolume if available, otherwise current volume
        savedVolume = lastKnownUserVolume !== null ? lastKnownUserVolume : videoPlayer.volume;
        savedMuted = videoPlayer.muted;
        
        log(`Saved volume state: ${Math.round(savedVolume * 100)}%, muted: ${savedMuted}`);
    }
    
    function restoreSavedVolumeState(videoPlayer) {
        if (!videoPlayer || savedVolume === null) return;
        
        setVolume(videoPlayer, savedVolume);
        if (savedMuted !== null) {
            videoPlayer.muted = savedMuted;
        }
        
        log(`Restored volume state: ${Math.round(savedVolume * 100)}%, muted: ${savedMuted}`);
        
        savedVolume = null;
        savedMuted = null;
    }
    
    function checkForAds() {
        // Find the player element if not already found
        if (!playerElement) {
            playerElement = document.getElementById('movie_player');
            if (!playerElement) return;
        }
        
        const videoPlayer = document.querySelector('video');
        if (!videoPlayer) return;
        
        // Check for ad indicators
        const isAdShowing = 
            playerElement.classList.contains('ad-showing') ||
            playerElement.classList.contains('ad-interrupting');
            
        const isAdSequence = playerElement.querySelector('.ytp-ad-preview-container');
        
        // Ad started
        if (isAdShowing && !adPlaying) {
            adPlaying = true;
            log('Ad detected - saving volume and reducing to ' + Math.round(AD_VOLUME * 100) + '%');
            
            saveCurrentVolumeState(videoPlayer);
            
            // Set ad volume after a short delay to ensure it takes effect
            setTimeout(() => {
                setVolume(videoPlayer, AD_VOLUME);
            }, 10);
        }
        // Ad ended
        else if (!isAdShowing && !isAdSequence && adPlaying) {
            adPlaying = false;
            log('Ad ended - restoring original volume');
            restoreSavedVolumeState(videoPlayer);
        }
        // Ad still playing - ensure volume stays low
        else if (isAdShowing && adPlaying) {
            if (Math.abs(videoPlayer.volume - AD_VOLUME) > 0.01) {
                setVolume(videoPlayer, AD_VOLUME);
            }
        }
    }
    
    function setupVolumeTracking() {
        const videoPlayer = document.querySelector('video');
        if (!videoPlayer) return;
        
        // Track user volume changes when not in an ad
        videoPlayer.addEventListener('volumechange', function() {
            if (!adPlaying && savedVolume === null) {
                lastKnownUserVolume = videoPlayer.volume;
            }
        });
    }
    
    function init() {
        log('Initializing YouTube Ad Volume Controller');
        
        // Wait for the page to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
            return;
        }
        
        // Wait for YouTube player to load
        const waitForPlayer = () => {
            playerElement = document.getElementById('movie_player');
            const videoPlayer = document.querySelector('video');
            
            if (playerElement && videoPlayer) {
                log('YouTube player found - setting up ad detection');
                
                // Set up volume tracking
                setupVolumeTracking();
                
                // Use MutationObserver for more responsive ad detection
                const observer = new MutationObserver(function(mutations) {
                    for (let mutation of mutations) {
                        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                            checkForAds();
                        }
                    }
                });
                
                observer.observe(playerElement, { attributes: true });
                
                // Also check periodically as a fallback
                if (checkInterval) clearInterval(checkInterval);
                checkInterval = setInterval(checkForAds, CHECK_INTERVAL);
                
                // Initial check
                checkForAds();
                
                log('Ad volume controller is now active');
            } else {
                // Retry after 1 second
                setTimeout(waitForPlayer, 1000);
            }
        };
        
        waitForPlayer();
    }
    
    // Cleanup function
    function cleanup() {
        if (checkInterval) {
            clearInterval(checkInterval);
            checkInterval = null;
        }
        
        // Restore volume if we're in the middle of an ad
        const videoPlayer = document.querySelector('video');
        if (videoPlayer && savedVolume !== null) {
            restoreSavedVolumeState(videoPlayer);
        }
        
        log('Cleaned up');
    }
    
    // Handle page navigation (YouTube is a SPA)
    let currentUrl = location.href;
    new MutationObserver(() => {
        if (location.href !== currentUrl) {
            currentUrl = location.href;
            log('Page navigation detected - reinitializing');
            
            // Reset state
            adPlaying = false;
            savedVolume = null;
            savedMuted = null;
            lastKnownUserVolume = null;
            playerElement = null;
            
            // Reinitialize after a short delay
            setTimeout(init, 500);
        }
    }).observe(document, { subtree: true, childList: true });
    
    // Set up cleanup on page unload
    window.addEventListener('beforeunload', cleanup);
    
    // Start the script
    init();
    
})();
