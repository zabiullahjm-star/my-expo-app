export async function checkForUpdate(): Promise<void> {
    try {
        const response = await fetch("https://zabiullahjm-star.github.io/price-site/version.json");
        const data: { version: string } = await response.json();

        const currentVersion = "1.0.0"; // اینو هر بار با نسخه اپت ست کن

        if (data.version !== currentVersion) {
            alert(نسخه جدید ${ data.version } موجود است! لطفاً آپدیت کنید.);
        }
    } catch (error) {
        console.log("خطا در بررسی آپدیت:", error);
    }
}