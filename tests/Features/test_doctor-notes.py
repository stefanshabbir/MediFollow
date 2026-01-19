import config
import random
import time

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait


PATIENT_PATH = "/doctor/patients/4fa73507-0e87-41e2-a66a-f055b994c260"
NOTES_SELECTOR = 'textarea[placeholder*="Type clinical observations, diagnosis, and treatment plan..."]'


def test_DN001(doctor_login:webdriver.Edge | webdriver.Chrome):
    """
    Open Notes Load Existing Draft: Open consultation notes for a patient and verify existing draft loads.
    """
    driver = doctor_login
    driver.get(f"{config.BASE_URL}{PATIENT_PATH}")
    test_text = "test_DN001: Placing dummy draft text. " + str(random.randint(1000, 9999))
    notes_field = WebDriverWait(driver, 10).until(
    EC.presence_of_element_located((By.CSS_SELECTOR, NOTES_SELECTOR)) 
    )
    notes_field.clear()
    notes_field.send_keys(test_text)

    time.sleep(5)  # Wait for autosave to occur
    driver.get(f"{config.BASE_URL}/doctor/patients")
    driver.get(f"{config.BASE_URL}{PATIENT_PATH}")
    driver.refresh()

    draft_text = WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, NOTES_SELECTOR))
    ).get_attribute("value")
    assert draft_text == test_text, f"FAILED: Draft text did not persist. Expected: {test_text}, Found: {draft_text}"


def test_DN003(doctor_login:webdriver.Edge | webdriver.Chrome):
    """
    Auto Save Draft Interval: Type text and wait for autosave interval to elapse; verify draft saved.
    """
    driver = doctor_login
    driver.get(f"{config.BASE_URL}{PATIENT_PATH}")
    test_text = "test_DN003: Placing dummy text to test autosave. " + str(random.randint(1000, 9999))
    notes_field = WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, NOTES_SELECTOR)) 
    )

    notes_field.clear()
    notes_field.send_keys(test_text)
    time.sleep(5)  # Wait for autosave interval (assuming 5 seconds)

    driver.refresh()
    draft_text = driver.find_element(By.CSS_SELECTOR, NOTES_SELECTOR).get_attribute("value")     
    assert draft_text == test_text, f"FAILED: Draft text did not persist. Expected: {test_text}, Found: {draft_text}"


def test_DN004_DN005(doctor_login:webdriver.Edge | webdriver.Chrome):
    """
    DN-004 - Manual Save Finalize: Click Finalize Consultation and verify draft becomes final record.\n
    DN-005 - Edit After Finalize Blocked: Attempt to edit notes after finalize and verify edits are blocked.
    """
    driver = doctor_login
    driver.get(f"{config.BASE_URL}{PATIENT_PATH}")
    test_text = "test_DN004: Placing dummy text to test manual save. " + str(random.randint(1000, 9999))
    notes_field = WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, NOTES_SELECTOR))
    )

    notes_field.clear()
    notes_field.send_keys(test_text)

    WebDriverWait(driver, 10).until(EC.element_to_be_clickable((By.XPATH, "//button[text()='Finalize Consultation']"))).click()
    WebDriverWait(driver, 10).until(EC.alert_is_present()).accept()     
    confirmation_text = WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.XPATH, "//div[contains(normalize-space(.), 'Finalized') and .//*[local-name()='svg']]"))
    ).get_attribute("innerText")

    assert "Finalized" in confirmation_text, "FAILED: Consultation was not finalized properly."
    assert not notes_field.is_enabled(), "FAILED: Notes field is still editable after finalization."


def test_DN002(doctor_login:webdriver.Edge | webdriver.Chrome):
    """
    Start New Note Empty Draft: Open notes when no draft exists and verify editor state
    """
    driver = doctor_login
    driver.get(f"{config.BASE_URL}{PATIENT_PATH}")

    notes_field = WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, NOTES_SELECTOR)) 
    )
    assert notes_field.get_attribute("value") == "", "FAILED: Expected empty draft for new note, but found existing text."