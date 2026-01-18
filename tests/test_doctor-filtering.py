import config
import random
import time

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait


BOOK_APPOINTMENT_PATH = "/patient/book"
DOCTOR_CARDS_SELECTOR = ".grid.gap-4 div.rounded-lg.border.bg-card"


def _get_cards(driver):
    return driver.find_elements(By.CSS_SELECTOR, DOCTOR_CARDS_SELECTOR)


def _select_clinic(wait: WebDriverWait, clinic_name: str):
    trigger = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, 'button[role="combobox"]')))
    trigger.click()

    wait.until(lambda driver: driver.find_element(By.CSS_SELECTOR, 'button[role="combobox"]').get_attribute("aria-expanded") == "true")
    controls_id = trigger.get_attribute("aria-controls")
    if controls_id:
        wait.until(EC.presence_of_element_located((By.ID, controls_id)))

    option = wait.until(
        EC.element_to_be_clickable(
            (
                By.XPATH,
                f"//*[@role='option' and contains(normalize-space(), '{clinic_name}')]",
            )
        )
    )
    wait._driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", option)
    option.click()
    wait.until(EC.text_to_be_present_in_element((By.CSS_SELECTOR, 'button[role="combobox"] span'), clinic_name))


def _toggle_available(wait: WebDriverWait):
    checkbox = wait.until(EC.element_to_be_clickable((By.ID, "available")))
    checkbox.click()


def test_DF001(patient_login:webdriver.Edge | webdriver.Chrome):
    """
    Filter Appointments by Appointment Fee: Apply a single appointment fee filter on the appointments list and verify only appointments with the selected appointment fee are shown
    """
    driver = patient_login
    driver.get(f"{config.BASE_URL}{BOOK_APPOINTMENT_PATH}")
    
    wait = WebDriverWait(driver, 15)
    wait.until(EC.presence_of_all_elements_located((By.CSS_SELECTOR, DOCTOR_CARDS_SELECTOR)))
    initial_count = len(driver.find_elements(By.CSS_SELECTOR, DOCTOR_CARDS_SELECTOR))
    
    slider = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, 'span[role="slider"]')))
    slider.click()
    for _ in range(30):
        slider.send_keys(Keys.LEFT)
    
    time.sleep(3)  # Wait for filtering to take effect
    filtered_count = len(driver.find_elements(By.CSS_SELECTOR, DOCTOR_CARDS_SELECTOR))
    assert filtered_count < initial_count, "FAILED: Filtering did not reduce the number of doctors displayed."


def test_DF002(patient_login:webdriver.Edge | webdriver.Chrome):
    """
    Filter Appointments by Clinic: Apply a clinic filter on the appointments list and verify only appointments within that clinic are shown
    Example Clinics: MedClinic, HealthClinic
    """
    driver = patient_login
    driver.get(f"{config.BASE_URL}{BOOK_APPOINTMENT_PATH}")

    wait = WebDriverWait(driver, 15)
    wait.until(EC.presence_of_all_elements_located((By.CSS_SELECTOR, DOCTOR_CARDS_SELECTOR)))
    initial_count = len(_get_cards(driver))

    _select_clinic(wait, "MedClinic")
    time.sleep(1.5)

    cards = _get_cards(driver)
    assert cards, "FAILED: No doctors displayed after applying MedClinic filter."
    for card in cards:
        clinic_text = card.find_element(By.CSS_SELECTOR, ".text-muted-foreground").text
        assert clinic_text == "MedClinic", "FAILED: Clinic filter returned a doctor outside MedClinic."
    assert len(cards) < initial_count, "FAILED: Clinic filter did not narrow the results."


def test_DF003(patient_login:webdriver.Edge | webdriver.Chrome):
    """
    Filter Appointments by Status: Select a status filter e.g. Available Soon
    """
    driver = patient_login
    driver.get(f"{config.BASE_URL}{BOOK_APPOINTMENT_PATH}")

    wait = WebDriverWait(driver, 15)
    wait.until(EC.presence_of_all_elements_located((By.CSS_SELECTOR, DOCTOR_CARDS_SELECTOR)))
    initial_count = len(_get_cards(driver))

    _toggle_available(wait)
    wait.until(lambda d: any("Dr Seb" in card.text for card in _get_cards(d)))

    cards = _get_cards(driver)
    assert any("Dr Seb" in card.text for card in cards), "FAILED: Available Soon filter did not keep Dr Seb."


def test_DF004(patient_login:webdriver.Edge | webdriver.Chrome):
    """
    Filter Appointments by Doctor: Filter appointments by a specific doctor and verify results
    """
    driver = patient_login
    driver.get(f"{config.BASE_URL}{BOOK_APPOINTMENT_PATH}")

    wait = WebDriverWait(driver, 15)
    wait.until(EC.presence_of_all_elements_located((By.CSS_SELECTOR, DOCTOR_CARDS_SELECTOR)))

    search_box = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "input[placeholder='Name...']")))
    search_box.clear()
    search_box.send_keys("Dr Gemma Bones")

    wait.until(lambda d: len(_get_cards(d)) == 1)
    cards = _get_cards(driver)
    assert "Dr Gemma Bones" in cards[0].text, "FAILED: Doctor filter did not show Dr Gemma Bones."


def test_DF005(patient_login:webdriver.Edge | webdriver.Chrome):
    """
    Combined Filters Clinic + Status + Doctor: Apply multiple filters simultaneously and verify intersection of criteria
    """
    driver = patient_login
    driver.get(f"{config.BASE_URL}{BOOK_APPOINTMENT_PATH}")

    wait = WebDriverWait(driver, 15)
    wait.until(EC.presence_of_all_elements_located((By.CSS_SELECTOR, DOCTOR_CARDS_SELECTOR)))

    _select_clinic(wait, "HealthClinic")
    _toggle_available(wait)

    search_box = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "input[placeholder='Name...']")))
    search_box.clear()
    search_box.send_keys("Dr Seb")

    wait.until(lambda d: any("Dr Seb" in card.text for card in _get_cards(d)))
    matching = [card for card in _get_cards(driver) if "Dr Seb" in card.text]
    assert matching, "FAILED: Combined filters did not return Dr Seb."
    assert all("HealthClinic" in card.text for card in matching), "FAILED: Combined filters did not respect the selected clinic."


def test_DF006(patient_login:webdriver.Edge | webdriver.Chrome):
    """
    Filter Appointments with No Matches: Apply filters that yield no results e.g. future date + unavailable doctor
    """
    driver = patient_login
    driver.get(f"{config.BASE_URL}{BOOK_APPOINTMENT_PATH}")

    wait = WebDriverWait(driver, 15)
    wait.until(EC.presence_of_all_elements_located((By.CSS_SELECTOR, DOCTOR_CARDS_SELECTOR)))

    _select_clinic(wait, "MedClinic")
    _toggle_available(wait)

    search_box = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "input[placeholder='Name...']")))
    search_box.clear()
    search_box.send_keys("Dr Seb")

    wait.until(EC.presence_of_element_located((By.XPATH, "//*[contains(text(),'No doctors found')]")))
    assert len(_get_cards(driver)) == 0, "FAILED: Cards still visible when no matches expected."


def test_DF007(patient_login:webdriver.Edge | webdriver.Chrome):
    """
    Clear Filters: Apply filters then use Clear action and verify full list returns
    """
    driver = patient_login
    driver.get(f"{config.BASE_URL}{BOOK_APPOINTMENT_PATH}")

    wait = WebDriverWait(driver, 15)
    wait.until(EC.presence_of_all_elements_located((By.CSS_SELECTOR, DOCTOR_CARDS_SELECTOR)))
    initial_count = len(_get_cards(driver))

    _select_clinic(wait, "MedClinic")
    wait.until(lambda d: len(_get_cards(d)) < initial_count)
    filtered_count = len(_get_cards(driver))

    reset_button = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'Reset Filters') or contains(., 'Clear All Filters')]")))
    reset_button.click()

    wait.until(lambda d: len(_get_cards(d)) >= filtered_count)
    post_reset = len(_get_cards(driver))
    assert post_reset >= filtered_count, "FAILED: Reset did not restore the doctor list."

    search_box = driver.find_element(By.CSS_SELECTOR, "input[placeholder='Name...']")
    assert search_box.get_attribute("value") == "", "FAILED: Search box not cleared after reset."
    available_state = driver.find_element(By.ID, "available").get_attribute("aria-checked")
    assert available_state in (None, "false"), "FAILED: Availability checkbox stayed checked after reset."


def test_DF016(patient_login:webdriver.Edge | webdriver.Chrome):
    """
    SQL Injection Special Characters: Enter SQL-like input or special characters in text filters e.g. ' OR 1=1 --
    """
    driver = patient_login
    driver.get(f"{config.BASE_URL}{BOOK_APPOINTMENT_PATH}")

    wait = WebDriverWait(driver, 10)
    wait.until(EC.presence_of_all_elements_located((By.CSS_SELECTOR, DOCTOR_CARDS_SELECTOR)))
    initial_count = len(_get_cards(driver))

    injection = "' OR 1=1 --"
    search_box = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "input[placeholder='Name...']")))
    search_box.clear()
    search_box.send_keys(injection)

    time.sleep(1.5)
    cards_after = _get_cards(driver)
    assert len(cards_after) <= initial_count, "FAILED: Injection input expanded the result set."
    assert driver.title == "MediFollow - Healthcare Management Platform", "FAILED: Page state changed after injection attempt."
