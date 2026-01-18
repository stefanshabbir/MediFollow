import pytest

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


# Only works in windows for most PCs, exception because my edge doesn't work but brave does
def get_driver(headless:bool = False) -> webdriver.Edge | webdriver.Chrome:
    """
    Return a webdriver instance. Adjust browser binary path if needed.
    """
    options = webdriver.EdgeOptions()
    if headless: options.add_argument("--headless=new")
    options.add_experimental_option("detach", True)
    try:
        return webdriver.Edge(options=options)
    except Exception:
        from selenium.webdriver.chrome.options import Options
        options = Options()
        options.binary_location = r"C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe"
        if headless: options.add_argument("--headless=new")
        options.add_experimental_option("detach", True)
        return webdriver.Chrome(options=options)


def login(driver, base_url:str, email:str, password:str, timeout:int = 10) -> webdriver.Edge | webdriver.Chrome:
    """
    Perform login using the provided driver and credentials.
    """
    driver.get(f"{base_url}/login") 
    
    WebDriverWait(driver, timeout).until(
        EC.presence_of_element_located((By.ID, "email")) 
    ).send_keys(email)
    WebDriverWait(driver, timeout).until(
        EC.presence_of_element_located((By.ID, "password"))
    ).send_keys(password)

    driver.find_element(By.CSS_SELECTOR, 'button[type="submit"]').click()

    WebDriverWait(driver, timeout).until(EC.title_is("MediFollow - Healthcare Management Platform"))
    # print("\n" + "="*10)
    # print(f"Login successful as user, {email}! Page title is: {driver.title}\n")
    return driver