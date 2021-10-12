{
  "caption": "Berichtenwachtrij",
  "description": "Berichtenwachtrij",
  "attributes": [
    {
      "name": "queueCode",
      "caption": "Wachtrijcode",
      "description": "Ontvangers bepalen handler aan de hand van deze code. Voor elke queCode moet een ontvanger zijn die deze afhandelt"
    },
    {
      "name": "msgCmd",
      "caption": "Opdracht",
      "description": "Opdracht voor ontvanger. Bevat een JSON-geserialiseerd object met opdrachtparameters. Opdracht moet attributen bevatten die de ontvanger begrijpt"
    },
    {
      "name": "msgData",
      "caption": "Berichtgegevens",
      "description": "Aanvullende gegevens voor bericht. Kan Base64-gecodeerde binaire gegevens bevatten"
    },
    {
      "name": "msgPriority",
      "caption": "Prioriteit",
      "description": "Prioriteit van berichten. 1 = Hoog, 0 = Laag, standaard 1"
    },
    {
      "name": "completeDate",
      "caption": "Volledige gegevens"
    }
  ]
}