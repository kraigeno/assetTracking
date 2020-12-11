#!/bin/sh

# This test script sends a series of POST requests to the asset server.
# Each request updates the tracking data for an asset, simulating what would happen for a real asset in the
# field as it moves around and the system receives its data in real time.

echosend () {
  while true
  do
    read POSTDATA
    if [ ! "$POSTDATA" ]
    then
      exit
    fi
    echo "postdata: $POSTDATA"
    curl -X POST -H 'Content-Type:application/text' -H 'auth-token:1D353F86D4A9' 'http://localhost:8001/assetUpdate' \
         -d "$POSTDATA"

    sleep 3
  done
}


echosend <<EOF
DSV-2|1608000001|47.8|-122.5|0|stowed
DSV-2|1608000002|47.9|-122.5|0|transporting
DSV-2|1608000003|48.0|-122.5|0|transporting
DSV-2|1608000004|48.5|-123.0|0|transporting
DSV-2|1608000005|48.5|-125.0|0|transporting
DSV-2|1608000007|49.0|-127.0|0|transporting
DSV-2|1608000008|49.0|-130.0|0|transporting
DSV-2|1608000009|50.0|-140.0|0|transporting
DSV-2|1608000010|51.0|-150.0|0|transporting
DSV-2|1608000011|52.0|-160.0|0|transporting
DSV-2|1608000012|53.0|-164.0|0|transporting
DSV-2|1608000013|54.0|-167.0|0|launching
DSV-2|1608000014|54.0|-167.0|5|operating
DSV-2|1608000015|54.0|-167.0|10|operating
DSV-2|1608000016|54.0|-167.0|100|operating
DSV-2|1608000017|54.0|-167.0|101|operating
DSV-2|1608000018|54.0|-167.0|102|operating
DSV-2|1608000019|54.0|-167.0|103|operating
EOF

