{
    "caption": "Planners",
    "description": "Geplande opdrachten",
    "attributes": [
        {
            "name": "ID",
            "caption": "ID",
            "description": "CRC32(Naam)"
        },
        {
            "name": "name",
            "caption": "Opdrachtsnaam",
            "description": "Unieke opdrachtsnaam. Modellen overschrijven opdrachten met dezelfde naam, zodat de modellen luisteren in de serverconfiguratie"
        },
        {
            "name": "schedulingCondition",
            "caption": "Voorwaarden voor het plannen van een opdracht",
            "description": "Expressie die moet worden geëvalueerd tijdens het opstarten van de server. Het opdracht wordt uitgevoerd als het resultaat leeg is of als 'true' wordt geëvalueerd"
        },
        {
            "name": "cron",
            "caption": "Cron record",
            "description": "cron voor opdrachten zoals in unix-systemen. Formaat: 'Seconds=(0-59) Minutes(0-59) Hours(0-23) DayOfMonth(1-31) Months(0-11) DayOfWeek(0-6)'"
        },
        {
            "name": "description",
            "caption": "Beschrijving",
            "description": "Opdrachtsbeschrijving"
        },
        {
            "name": "command",
            "caption": "Opdracht",
            "description": "De naam van de functie die moet worden uitgevoerd in de servercontext"
        },
        {
            "name": "module",
            "caption": "Module",
            "description": "De naam van de module die door de taakplanner moet worden aangevraagd als de standaard geëxporteerde waarde"
        },
        {
            "name": "singleton",
            "caption": "Singleton",
            "description": "Als '1' - slechts één exemplaar van de taak die wordt uitgevoerd, is toegestaan"
        },
        {
            "name": "runAs",
            "caption": "Uitvoeren namens",
            "description": "Gebruikersnaam voor het opdrachten"
        },
        {
            "name": "logSuccessful",
            "caption": "Succeslog",
            "description": "Als 1 (standaard), dan wordt het resultaat van een succesvolle uitvoering van de taak vastgelegd in 'ubq_runstat', anders - alleen fouten"
        },
        {
            "name": "overridden",
            "caption": "Overlapt",
            "description": "Geeft aan dat het oorspronkelijke opdracht wordt overschreven door andere modellen"
        },
        {
            "name": "originalModel",
            "caption": "Origineel model",
            "description": "De naam van het model waarin de oorspronkelijke taakdefinitie is opgeslagen"
        },
        {
            "name": "actualModel",
            "caption": "Werkelijk model",
            "description": "De naam van het model waarin het bestand met de huidige taakdefinitie is opgeslagen. Kan afwijken van het oorspronkelijke model als iemand de taak heeft overschreven"
        }
    ]
}